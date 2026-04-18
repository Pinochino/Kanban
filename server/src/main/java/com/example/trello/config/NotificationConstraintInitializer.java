package com.example.trello.config;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class NotificationConstraintInitializer implements ApplicationRunner {

    JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1
                            FROM information_schema.tables
                            WHERE table_name = 'notifications'
                        ) THEN
                            ALTER TABLE notifications
                                DROP CONSTRAINT IF EXISTS notifications_type_check;

                            ALTER TABLE notifications
                                ADD CONSTRAINT notifications_type_check
                                CHECK (type IN ('TASK_ASSIGNED', 'ADMIN_MESSAGE', 'TASK_DUE', 'TASK_REMINDER'));
                        END IF;
                    END $$;
                    """);
        } catch (Exception exception) {
            log.warn("Could not refresh notifications_type_check constraint: {}", exception.getMessage());
        }
    }
}
