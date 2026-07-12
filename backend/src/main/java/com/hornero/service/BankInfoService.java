package com.hornero.service;

import com.hornero.dto.BankInfoRequest;
import com.hornero.dto.BankInfoResponse;
import com.hornero.model.BankInfoConfirmationCode;
import com.hornero.model.CreatorBankInfo;
import com.hornero.model.CreatorBankInfo.AccountType;
import com.hornero.model.User;
import com.hornero.repository.BankInfoConfirmationCodeRepository;
import com.hornero.repository.CreatorBankInfoRepository;
import com.hornero.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Datos bancarios (CBU/CVU) del creador, donde terminan los payouts de sus
// campañas. Cambiarlos exige confirmar con la contraseña actual o con un código
// de 6 dígitos enviado por email (el usuario elige uno de los dos en el modal).
@Service
public class BankInfoService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CreatorBankInfoRepository creatorBankInfoRepository;

    @Autowired
    private BankInfoConfirmationCodeRepository confirmationCodeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private EmailService emailService;

    public BankInfoResponse getBankInfo(Long userId) {
        return creatorBankInfoRepository.findByUserId(userId)
                .map(info -> new BankInfoResponse(
                        info.getAccountType().name(),
                        encryptionService.decrypt(info.getAccountNumber()),
                        info.getAccountAlias(),
                        info.getBankOrWalletName(),
                        info.getAccountHolderName(),
                        info.getUpdatedAt()))
                .orElse(null);
    }

    /**
     * Generates and emails a fresh 6-digit code, invalidating any previous unused
     * one for this user (only the latest code is ever valid).
     */
    @Transactional
    public void requestConfirmationCode(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        confirmationCodeRepository.deleteByUserId(userId);

        BankInfoConfirmationCode confirmationCode = new BankInfoConfirmationCode(user);
        confirmationCodeRepository.save(confirmationCode);

        emailService.sendBankInfoConfirmationCode(user.getEmail(), user.getFirstName(), confirmationCode.getCode());
    }

    @Transactional
    public BankInfoResponse updateBankInfo(Long userId, BankInfoRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        verifyConfirmation(userId, user, req);

        AccountType accountType;
        try {
            accountType = AccountType.valueOf(req.getAccountType());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new RuntimeException("El tipo de cuenta debe ser CBU o CVU");
        }

        String accountNumber = req.getAccountNumber() == null ? "" : req.getAccountNumber().trim();
        if (!accountNumber.matches("\\d{22}")) {
            throw new RuntimeException("El CBU/CVU debe tener 22 dígitos");
        }

        CreatorBankInfo bankInfo = creatorBankInfoRepository.findByUserId(userId)
                .orElseGet(() -> {
                    CreatorBankInfo created = new CreatorBankInfo();
                    created.setUser(user);
                    return created;
                });

        bankInfo.setAccountType(accountType);
        bankInfo.setAccountNumber(encryptionService.encrypt(accountNumber));
        bankInfo.setAccountAlias(req.getAccountAlias());
        bankInfo.setBankOrWalletName(req.getBankOrWalletName());
        bankInfo.setAccountHolderName(req.getAccountHolderName());
        creatorBankInfoRepository.save(bankInfo);

        String maskedAccountNumber = "..." + accountNumber.substring(accountNumber.length() - 4);
        emailService.sendBankInfoChangedEmail(user.getEmail(), user.getFirstName(), maskedAccountNumber);

        return new BankInfoResponse(
                bankInfo.getAccountType().name(),
                accountNumber,
                bankInfo.getAccountAlias(),
                bankInfo.getBankOrWalletName(),
                bankInfo.getAccountHolderName(),
                bankInfo.getUpdatedAt());
    }

    // Exactamente un método de confirmación: contraseña actual O código por email.
    private void verifyConfirmation(Long userId, User user, BankInfoRequest req) {
        boolean hasPassword = req.getCurrentPassword() != null && !req.getCurrentPassword().isBlank();
        boolean hasCode = req.getConfirmationCode() != null && !req.getConfirmationCode().isBlank();

        if (hasPassword) {
            if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("La contraseña actual es incorrecta");
            }
            return;
        }

        if (hasCode) {
            BankInfoConfirmationCode confirmationCode = confirmationCodeRepository
                    .findTopByUserIdAndUsedFalseOrderByIdDesc(userId)
                    .orElseThrow(() -> new RuntimeException("No solicitaste un código de confirmación"));

            if (!confirmationCode.isValid() || !confirmationCode.getCode().equals(req.getConfirmationCode().trim())) {
                throw new RuntimeException("El código de confirmación es inválido o expiró");
            }

            confirmationCode.setUsed(true);
            confirmationCodeRepository.save(confirmationCode);
            return;
        }

        throw new RuntimeException("Confirmá el cambio con tu contraseña o con un código de email");
    }
}
