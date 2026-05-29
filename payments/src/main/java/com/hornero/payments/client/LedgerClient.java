package com.hornero.payments.client;

import com.hornero.payments.model.Contribution;
import com.hornero.payments.model.Payout;
import com.hornero.payments.model.Refund;
import com.hornero.payments.model.Transaction;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigInteger;

@Component
public class LedgerClient {

    public static final String WALLET_OUT_OF_MONEY = "WALLET_OUT_OF_MONEY";
    public static final String BLOCKCHAIN_REGISTRATION_FAILED = "BLOCKCHAIN_REGISTRATION_FAILED";
    private static final String HORNERO_MAIN_ACCOUNT = "HORNERO_MAIN_ACCOUNT";

    private static final Logger logger = LoggerFactory.getLogger(LedgerClient.class);

    private final RestTemplate restTemplate;

    @Value("${app.blockchain.url}")
    private String blockchainUrl;

    public LedgerClient() {
        HttpComponentsClientHttpRequestFactory factory =
                new HttpComponentsClientHttpRequestFactory(HttpClients.createDefault());
        this.restTemplate = new RestTemplate(factory);
    }

    public String registerContributionTransaction(String username, Transaction transaction, String campaignTitle) {
        return registerTransaction(
                username,
                HORNERO_MAIN_ACCOUNT,
                transaction.getAmount(),
                buildReference("campaign:" + campaignTitle, "mpOperation", transaction.getIdTransactionExternal())
        );
    }

    public String registerPayoutTransaction(String creatorUsername, Payout payout, String campaignTitle) {
        return registerTransaction(
                HORNERO_MAIN_ACCOUNT,
                "CREATOR_" + creatorUsername,
                payout.getNetAmount(),
                buildReference("campaign:" + campaignTitle, "mpOperation", payout.getIdPayoutExternal())
        );
    }

    public String registerRefundTransaction(String username, Refund refund, String campaignTitle) {
        return registerTransaction(
                HORNERO_MAIN_ACCOUNT,
                username,
                refund.getAmount(),
                buildReference("refund campaign:" + campaignTitle, "mpOperation", refund.getIdRefundExternal())
        );
    }

    private String registerTransaction(String emisor, String receptor, java.math.BigDecimal amount, String reference) {
        String url = blockchainUrl + "/api/v1/transactions";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        LedgerRegisterRequest request = new LedgerRegisterRequest(
                emisor,
                receptor,
                amount.movePointRight(2).toBigIntegerExact(),
                reference
        );

        try {
            LedgerRegisterResponse response = restTemplate.postForObject(
                    url,
                    new HttpEntity<>(request, headers),
                    LedgerRegisterResponse.class
            );

            if (response == null || response.txHash() == null || response.txHash().isBlank()) {
                logger.warn("Registro en blockchain sin txHash para reference {}", reference);
                return BLOCKCHAIN_REGISTRATION_FAILED;
            }

            logger.info("Registro en blockchain exitoso para reference {} con txHash={}", reference, response.txHash());
            return response.txHash();
        } catch (HttpClientErrorException e) {
            String body = e.getResponseBodyAsString();
            if (isWalletOutOfMoney(body)) {
                logger.warn("Wallet sin fondos para registrar reference {} en blockchain", reference);
                return WALLET_OUT_OF_MONEY;
            }

            logger.error("Error funcional registrando reference {} en blockchain: status={} body={}",
                    reference, e.getStatusCode(), body);
            return BLOCKCHAIN_REGISTRATION_FAILED;
        } catch (RestClientException | ArithmeticException e) {
            logger.error("Error registrando reference {} en blockchain: {}", reference, e.getMessage());
            return BLOCKCHAIN_REGISTRATION_FAILED;
        }
    }

    private boolean isWalletOutOfMoney(String responseBody) {
        if (responseBody == null) {
            return false;
        }

        String normalized = responseBody.toLowerCase();
        return normalized.contains("insufficient funds")
                || normalized.contains("fund wallet")
                || normalized.contains("balancewei");
    }

    private String buildReference(String baseReference, String fieldName, String fieldValue) {
        if (fieldValue == null || fieldValue.isBlank()) {
            return baseReference;
        }
        return baseReference + " | " + fieldName + ":" + fieldValue;
    }

    private record LedgerRegisterRequest(
            String emisor,
            String receptor,
            BigInteger amount,
            String reference
    ) {
    }

    private record LedgerRegisterResponse(
            boolean ok,
            String txHash,
            String contractAddress,
            String explorerUrl
    ) {
    }
}
