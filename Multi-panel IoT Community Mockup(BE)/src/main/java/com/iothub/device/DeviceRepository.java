package com.iothub.device;

import com.iothub.common.ActiveStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Device, Integer> {

    Optional<Device> findByDeviceCode(String deviceCode);

    List<Device> findByStatusOrderByDeviceId(ActiveStatus status);

    List<Device> findAllByOrderByDeviceId();
}
