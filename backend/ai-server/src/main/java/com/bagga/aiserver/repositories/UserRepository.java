package com.bagga.aiserver.repositories;

import com.bagga.aiserver.entities.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByCin(String cin);
}
