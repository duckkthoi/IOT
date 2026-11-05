package com.iothub.schedule;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeviceScheduleRepository extends JpaRepository<DeviceSchedule, Integer> {

    List<DeviceSchedule> findByEnabledTrue();

    List<DeviceSchedule> findAllByOrderByScheduleId();
}
