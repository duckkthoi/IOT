package com.iothub.device;

import com.iothub.device.DeviceEnums.ResultStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface DeviceActionRepository extends JpaRepository<DeviceAction, Long> {

    /** Chuyen trang thai co dieu kien, vd. qua timeout ma van pending -> unconfirmed (SRS UC3 luong ngoai le). */
    @Modifying
    @Transactional
    @Query("update DeviceAction a set a.resultStatus = :to where a.actionId = :id and a.resultStatus = :from")
    int transition(Long id, ResultStatus from, ResultStatus to);
}
