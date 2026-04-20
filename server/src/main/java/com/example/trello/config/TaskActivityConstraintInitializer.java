package com.example.trello.config;

import com.example.trello.constants.ActionType;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TaskActivityConstraintInitializer implements ApplicationRunner {

    JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            String allowedValues = Arrays.stream(ActionType.values())
                    .map(ActionType::name)
                    .map(value -> "'" + value + "'")
                    .collect(Collectors.joining(", "));

            jdbcTemplate.execute("""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1
                            FROM information_schema.tables
                            WHERE table_name = 'task_activity'
                        ) THEN
                            ALTER TABLE task_activity
                                DROP CONSTRAINT IF EXISTS task_activity_action_type_check;

                            ALTER TABLE task_activity
                                ADD CONSTRAINT task_activity_action_type_check
                                CHECK (action_type IN (%s));
                        END IF;
                    END $$;
                    """.formatted(allowedValues));
        } catch (Exception exception) {
            log.warn("Could not refresh task_activity_action_type_check constraint: {}", exception.getMessage());
        }
    }
}