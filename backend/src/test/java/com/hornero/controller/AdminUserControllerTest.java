package com.hornero.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hornero.config.GlobalExceptionHandler;
import com.hornero.dto.AdminUserListResponse;
import com.hornero.model.User;
import com.hornero.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminUserControllerTest {

    private UserService userService;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        userService = mock(UserService.class);
        AdminUserController controller = new AdminUserController();
        ReflectionTestUtils.setField(controller, "userService", userService);
        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void listUsers_asNonAdmin_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/users").requestAttr("userRole", "USER"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(userService);
    }

    @Test
    void listUsers_asAdmin_returns200() throws Exception {
        when(userService.listUsers(0, 10)).thenReturn(new AdminUserListResponse());

        mockMvc.perform(get("/api/admin/users")
                        .requestAttr("userRole", "ADMIN")
                        .param("page", "0").param("size", "10"))
                .andExpect(status().isOk());

        verify(userService).listUsers(0, 10);
    }

    @Test
    void promoteToAdmin_asNonAdmin_returns403() throws Exception {
        mockMvc.perform(post("/api/admin/users/2/promote-admin").requestAttr("userRole", "USER"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(userService);
    }

    @Test
    void promoteToAdmin_whenServiceRejectsSelfChange_returns400() throws Exception {
        when(userService.promoteToAdmin(1L, 1L))
                .thenThrow(new RuntimeException("No podés cambiar tu propio rol desde esta sección"));

        mockMvc.perform(post("/api/admin/users/1/promote-admin")
                        .requestAttr("userRole", "ADMIN")
                        .requestAttr("userId", 1L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("tu propio rol")));
    }

    @Test
    void promoteToAdmin_whenValid_returns200WithUser() throws Exception {
        User user = new User();
        user.setId(2L);
        user.setUserName("nuevo");
        when(userService.promoteToAdmin(2L, 1L)).thenReturn(user);

        mockMvc.perform(post("/api/admin/users/2/promote-admin")
                        .requestAttr("userRole", "ADMIN")
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.userName").value("nuevo"));
    }

    @Test
    void updateStatus_asNonAdmin_returns403() throws Exception {
        mockMvc.perform(patch("/api/admin/users/2/status")
                        .requestAttr("userRole", "USER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("enabled", false))))
                .andExpect(status().isForbidden());

        verifyNoInteractions(userService);
    }

    @Test
    void updateStatus_withMissingEnabledField_returns400() throws Exception {
        mockMvc.perform(patch("/api/admin/users/2/status")
                        .requestAttr("userRole", "ADMIN")
                        .requestAttr("userId", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());

        verifyNoInteractions(userService);
    }

    @Test
    void updateStatus_whenValid_delegatesToService() throws Exception {
        User user = new User();
        user.setId(2L);
        when(userService.setUserEnabled(2L, false, 1L)).thenReturn(user);

        mockMvc.perform(patch("/api/admin/users/2/status")
                        .requestAttr("userRole", "ADMIN")
                        .requestAttr("userId", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("enabled", false))))
                .andExpect(status().isOk());

        verify(userService).setUserEnabled(2L, false, 1L);
    }
}
