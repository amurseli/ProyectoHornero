package com.hornero.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Valida que una contraseña cumpla la política de seguridad: longitud mínima,
 * al menos una mayúscula, una minúscula, un número y un carácter especial.
 *
 * Cada regla que falla se reporta por separado, de modo que la respuesta de la
 * API lista todos los requisitos incumplidos (no solo el primero).
 *
 * Mantener en sync con el validador del frontend en
 * frontend/src/utils/passwordPolicy.js
 */
@Documented
@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {

    String message() default "La contraseña no cumple con los requisitos de seguridad";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
