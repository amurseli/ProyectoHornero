package com.hornero.payments.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new ThrowingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void illegalArgumentException_returns400() throws Exception {
        mockMvc.perform(get("/test/illegalArg"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void illegalStateException_returns422() throws Exception {
        mockMvc.perform(get("/test/illegalState"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void securityException_returns403() throws Exception {
        mockMvc.perform(get("/test/security"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void runtimeException_returns500() throws Exception {
        mockMvc.perform(get("/test/runtime"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").exists());
    }

    @RestController
    static class ThrowingController {
        @GetMapping("/test/{type}")
        void throwException(@PathVariable String type) {
            switch (type) {
                case "illegalArg"   -> throw new IllegalArgumentException("bad input");
                case "illegalState" -> throw new IllegalStateException("wrong state");
                case "security"     -> throw new SecurityException("forbidden");
                case "runtime"      -> throw new RuntimeException("internal error");
            }
        }
    }
}
