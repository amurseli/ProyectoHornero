package com.hornero.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Implementación de {@link StrongPassword}. Evalúa la contraseña contra cada
 * regla y agrega una violación por cada requisito incumplido.
 */
public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    static final int MIN_LENGTH = 8;
    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern NUMBER = Pattern.compile("\\d");
    private static final Pattern SPECIAL = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // La ausencia de valor la cubre @NotBlank; acá no reportamos para evitar
        // mensajes duplicados.
        if (value == null) {
            return true;
        }

        List<String> failures = new ArrayList<>();
        if (value.length() < MIN_LENGTH) {
            failures.add("La contraseña debe tener al menos " + MIN_LENGTH + " caracteres");
        }
        if (!UPPERCASE.matcher(value).find()) {
            failures.add("La contraseña debe tener al menos una letra mayúscula");
        }
        if (!LOWERCASE.matcher(value).find()) {
            failures.add("La contraseña debe tener al menos una letra minúscula");
        }
        if (!NUMBER.matcher(value).find()) {
            failures.add("La contraseña debe tener al menos un número");
        }
        if (!SPECIAL.matcher(value).find()) {
            failures.add("La contraseña debe tener al menos un carácter especial");
        }

        if (failures.isEmpty()) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        for (String failure : failures) {
            context.buildConstraintViolationWithTemplate(failure).addConstraintViolation();
        }
        return false;
    }
}
