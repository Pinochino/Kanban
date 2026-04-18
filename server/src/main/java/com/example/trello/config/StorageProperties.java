package com.example.trello.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@ConfigurationProperties("storage")
@Setter
@Getter
@FieldDefaults(level = AccessLevel.PACKAGE)
public class StorageProperties {

    String location = "upload-dir";

}
