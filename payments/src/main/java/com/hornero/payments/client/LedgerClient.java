package com.hornero.payments.client;

import com.hornero.payments.model.Contribution;
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

    private static final Logger logger = LoggerFactory.getLogger(LedgerClient.class);

    private final RestTemplate restTemplate;

    @Value("${app.blockchain.url}")
    private String blockchainUrl;

    public LedgerClient() {
        HttpComponentsClientHttpRequestFactory factory =
                new HttpComponentsClientHttpRequestFactory(HttpClients.createDefault());
        this.restTemplate = new RestTemplate(factory);
    }

    public String registerTransaction(Contribution contribution, Transaction transaction) {
        String url = blockchainUrl + "/api/v1/transactions";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        LedgerRegisterRequest request = new LedgerRegisterRequest(
                "USER_" + contribution.getIdUser(),
                "CAMPAIGN_" + contribution.getIdCampaign(),
                transaction.getAmount().movePointRight(2).toBigIntegerExact(),
                buildReference(contribution, transaction)
        );

        try {
            LedgerRegisterResponse response = restTemplate.postForObject(
                    url,
                    new HttpEntity<>(request, headers),
                    LedgerRegisterResponse.class
            );

            if (response == null || response.txHash() == null || response.txHash().isBlank()) {
                logger.warn("Registro en blockchain sin txHash para contribution {}", contribution.getId());
                return BLOCKCHAIN_REGISTRATION_FAILED;
            }

            logger.info("Contribution {} registrada en blockchain con txHash={}", contribution.getId(), response.txHash());
            return response.txHash();
        } catch (HttpClientErrorException e) {
            String body = e.getResponseBodyAsString();
            if (isWalletOutOfMoney(body)) {
                logger.warn("Wallet sin fondos para registrar contribution {} en blockchain", contribution.getId());
                return WALLET_OUT_OF_MONEY;
            }

            logger.error("Error funcional registrando contribution {} en blockchain: status={} body={}",
                    contribution.getId(), e.getStatusCode(), body);
            return BLOCKCHAIN_REGISTRATION_FAILED;
        } catch (RestClientException | ArithmeticException e) {
            logger.error("Error registrando contribution {} en blockchain: {}", contribution.getId(), e.getMessage());
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

    private String buildReference(Contribution contribution, Transaction transaction) {
        return "contribution:" + contribution.getId() + "|payment:" + transaction.getIdTransactionExternal();
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
