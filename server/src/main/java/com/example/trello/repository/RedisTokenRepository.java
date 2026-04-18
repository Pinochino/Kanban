package com.example.trello.repository;

import com.example.trello.constants.TokenType;
import com.example.trello.model.RedisToken;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RedisTokenRepository extends CrudRepository<RedisToken, String> {


    Optional<RedisToken> findByJwtIdAndTokenType(String jwtId, TokenType tokenType);

    void deleteByJwtId(String jwtId);

    void deleteByJwtIdAndTokenType(String jwtId, TokenType tokenType);
}
