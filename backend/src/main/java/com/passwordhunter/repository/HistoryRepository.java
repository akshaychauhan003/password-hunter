package com.passwordhunter.repository;

import com.passwordhunter.model.SimulationHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HistoryRepository extends MongoRepository<SimulationHistory, String> {
    long countByUserId(String userId);
    void deleteByUserId(String userId);
}
