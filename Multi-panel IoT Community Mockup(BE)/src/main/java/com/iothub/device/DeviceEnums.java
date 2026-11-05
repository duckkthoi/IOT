package com.iothub.device;

/** Cac ENUM cua bang devices / device_actions. Ten hang = gia tri luu trong DB. */
public final class DeviceEnums {

    private DeviceEnums() {
    }

    /** devices.current_state */
    public enum PowerState { ON, OFF }

    /** device_actions.action - SRS: ON/OFF; firmware ho tro them BLINK. */
    public enum Command { ON, OFF, BLINK }

    /** device_actions.source */
    public enum ActionSource { manual, auto, schedule }

    /**
     * device_actions.result_status (mo rong): pending = da gui, cho phan hoi; success = thiet bi xac nhan;
     * failed = thiet bi bao loi / khong gui duoc lenh; unconfirmed = qua timeout chua co phan hoi.
     */
    public enum ResultStatus { pending, success, failed, unconfirmed }

    /** devices.mode (mo rong) */
    public enum Mode { MANUAL, BLINK }
}
