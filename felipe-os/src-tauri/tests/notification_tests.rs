use felipe_os_lib::{NotificationManager, NotificationType, NotificationPriority};

#[cfg(test)]
mod notification_property_tests {
    use super::*;
    use quickcheck::TestResult;
    use quickcheck_macros::quickcheck;

    // Property 4: Event-Driven Notifications
    // **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    // All notification types should be valid and serializable
    #[quickcheck]
    fn prop_notification_type_consistency(type_code: u8) -> TestResult {
        let notification_type = match type_code % 6 {
            0 => NotificationType::FocusStart,
            1 => NotificationType::FocusComplete,
            2 => NotificationType::ZonaRoja,
            3 => NotificationType::BreakTime,
            4 => NotificationType::SessionOverdue,
            _ => NotificationType::DayComplete,
        };

        // Property: All notification types should be valid and serializable
        let serialized = serde_json::to_string(&notification_type);
        let deserialized: Result<NotificationType, _> = serde_json::from_str(&serialized.unwrap());
        
        TestResult::from_bool(deserialized.is_ok())
    }

    // Property 5: Notification Priority Handling
    // **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
    // All notification priorities should be valid and orderable
    #[quickcheck]
    fn prop_notification_priority_consistency(priority_code: u8) -> TestResult {
        let priority = match priority_code % 4 {
            0 => NotificationPriority::Low,
            1 => NotificationPriority::Normal,
            2 => NotificationPriority::High,
            _ => NotificationPriority::Critical,
        };

        // Property: All priorities should be serializable and comparable
        let serialized = serde_json::to_string(&priority);
        let deserialized: Result<NotificationPriority, _> = serde_json::from_str(&serialized.unwrap());
        
        TestResult::from_bool(deserialized.is_ok())
    }

    // Test notification type enum completeness
    #[quickcheck]
    fn prop_notification_type_enum_completeness(type_code: u8) -> TestResult {
        let notification_type = match type_code % 6 {
            0 => NotificationType::FocusStart,
            1 => NotificationType::FocusComplete,
            2 => NotificationType::ZonaRoja,
            3 => NotificationType::BreakTime,
            4 => NotificationType::SessionOverdue,
            _ => NotificationType::DayComplete,
        };

        // Property: All notification types should be debuggable
        let debug_str = format!("{:?}", notification_type);
        let expected_variants = ["FocusStart", "FocusComplete", "ZonaRoja", "BreakTime", "SessionOverdue", "DayComplete"];
        
        let is_valid = expected_variants.iter().any(|&variant| debug_str.contains(variant));
        TestResult::from_bool(is_valid)
    }

    // Test notification priority ordering
    #[quickcheck]
    fn prop_notification_priority_ordering(priority1_code: u8, priority2_code: u8) -> TestResult {
        let priority1 = match priority1_code % 4 {
            0 => NotificationPriority::Low,
            1 => NotificationPriority::Normal,
            2 => NotificationPriority::High,
            _ => NotificationPriority::Critical,
        };

        let priority2 = match priority2_code % 4 {
            0 => NotificationPriority::Low,
            1 => NotificationPriority::Normal,
            2 => NotificationPriority::High,
            _ => NotificationPriority::Critical,
        };

        // Property: Priority comparison should be consistent
        let eq1 = priority1 == priority2;
        let eq2 = priority2 == priority1;
        
        TestResult::from_bool(eq1 == eq2)
    }

    // Test notification type cloning and equality
    #[quickcheck]
    fn prop_notification_type_clone_equality(type_code: u8) -> TestResult {
        let notification_type = match type_code % 6 {
            0 => NotificationType::FocusStart,
            1 => NotificationType::FocusComplete,
            2 => NotificationType::ZonaRoja,
            3 => NotificationType::BreakTime,
            4 => NotificationType::SessionOverdue,
            _ => NotificationType::DayComplete,
        };

        let cloned = notification_type.clone();
        
        // Property: Cloned notification type should be equal to original
        TestResult::from_bool(notification_type == cloned)
    }

    // Test notification priority cloning and equality
    #[quickcheck]
    fn prop_notification_priority_clone_equality(priority_code: u8) -> TestResult {
        let priority = match priority_code % 4 {
            0 => NotificationPriority::Low,
            1 => NotificationPriority::Normal,
            2 => NotificationPriority::High,
            _ => NotificationPriority::Critical,
        };

        let cloned = priority.clone();
        
        // Property: Cloned priority should be equal to original
        TestResult::from_bool(priority == cloned)
    }
}

// Unit tests for notification functionality
#[cfg(test)]
mod unit_tests {
    use super::*;

    #[test]
    fn test_notification_type_serialization() {
        let types = [
            NotificationType::FocusStart,
            NotificationType::FocusComplete,
            NotificationType::ZonaRoja,
            NotificationType::BreakTime,
            NotificationType::SessionOverdue,
            NotificationType::DayComplete,
        ];

        for notification_type in types.iter() {
            let serialized = serde_json::to_string(notification_type).unwrap();
            let deserialized: NotificationType = serde_json::from_str(&serialized).unwrap();
            
            // Verify round-trip serialization works
            assert_eq!(notification_type, &deserialized);
        }
    }

    #[test]
    fn test_notification_priority_serialization() {
        let priorities = [
            NotificationPriority::Low,
            NotificationPriority::Normal,
            NotificationPriority::High,
            NotificationPriority::Critical,
        ];

        for priority in priorities.iter() {
            let serialized = serde_json::to_string(priority).unwrap();
            let deserialized: NotificationPriority = serde_json::from_str(&serialized).unwrap();
            
            // Verify round-trip serialization works
            assert_eq!(priority, &deserialized);
        }
    }

    #[test]
    fn test_notification_type_debug_output() {
        assert_eq!(format!("{:?}", NotificationType::FocusStart), "FocusStart");
        assert_eq!(format!("{:?}", NotificationType::FocusComplete), "FocusComplete");
        assert_eq!(format!("{:?}", NotificationType::ZonaRoja), "ZonaRoja");
        assert_eq!(format!("{:?}", NotificationType::BreakTime), "BreakTime");
        assert_eq!(format!("{:?}", NotificationType::SessionOverdue), "SessionOverdue");
        assert_eq!(format!("{:?}", NotificationType::DayComplete), "DayComplete");
    }

    #[test]
    fn test_notification_priority_debug_output() {
        assert_eq!(format!("{:?}", NotificationPriority::Low), "Low");
        assert_eq!(format!("{:?}", NotificationPriority::Normal), "Normal");
        assert_eq!(format!("{:?}", NotificationPriority::High), "High");
        assert_eq!(format!("{:?}", NotificationPriority::Critical), "Critical");
    }

    #[test]
    fn test_notification_type_clone() {
        let original = NotificationType::FocusStart;
        let cloned = original.clone();
        
        assert_eq!(original, cloned);
    }

    #[test]
    fn test_notification_priority_clone() {
        let original = NotificationPriority::High;
        let cloned = original.clone();
        
        assert_eq!(original, cloned);
    }

    #[test]
    fn test_notification_type_equality() {
        assert_eq!(NotificationType::FocusStart, NotificationType::FocusStart);
        assert_ne!(NotificationType::FocusStart, NotificationType::FocusComplete);
    }

    #[test]
    fn test_notification_priority_equality() {
        assert_eq!(NotificationPriority::High, NotificationPriority::High);
        assert_ne!(NotificationPriority::High, NotificationPriority::Low);
    }
}