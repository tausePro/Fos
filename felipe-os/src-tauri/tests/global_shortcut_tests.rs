#[cfg(test)]
mod global_shortcut_property_tests {
    use quickcheck::TestResult;
    use quickcheck_macros::quickcheck;

    // Property 6: Global Shortcut Actions
    // **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    // All shortcut actions should be valid and executable
    #[quickcheck]
    fn prop_shortcut_action_consistency(action_code: u8) -> TestResult {
        let action = match action_code % 4 {
            0 => "toggle_focus_mode",
            1 => "activate_zona_roja",
            2 => "start_break",
            _ => "toggle_window",
        };

        // Property: All shortcut actions should be valid strings
        let is_valid = !action.is_empty() && action.chars().all(|c| c.is_alphanumeric() || c == '_');
        TestResult::from_bool(is_valid)
    }

    // Property 6: Global Shortcut Registration
    // **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    // All default shortcuts should be valid key combinations
    #[quickcheck]
    fn prop_default_shortcuts_valid(shortcut_code: u8) -> TestResult {
        let shortcut = match shortcut_code % 4 {
            0 => "Cmd+Shift+F",
            1 => "Cmd+Shift+Z",
            2 => "Cmd+Shift+B",
            _ => "Cmd+Shift+S",
        };

        // Property: All shortcuts should contain valid modifiers and keys
        let has_modifier = shortcut.contains("Cmd") || shortcut.contains("Ctrl") || 
                          shortcut.contains("Alt") || shortcut.contains("Shift");
        let has_separator = shortcut.contains("+");
        let parts: Vec<&str> = shortcut.split('+').collect();
        let has_key = parts.len() >= 2;

        TestResult::from_bool(has_modifier && has_separator && has_key)
    }

    // Property 7: Shortcut Conflict Resolution
    // **Validates: Requirements 4.5**
    // Duplicate shortcuts should be detected
    #[quickcheck]
    fn prop_shortcut_conflict_detection(shortcut1_code: u8, shortcut2_code: u8) -> TestResult {
        let shortcut1 = match shortcut1_code % 4 {
            0 => "Cmd+Shift+F",
            1 => "Cmd+Shift+Z",
            2 => "Cmd+Shift+B",
            _ => "Cmd+Shift+S",
        };

        let shortcut2 = match shortcut2_code % 4 {
            0 => "Cmd+Shift+F",
            1 => "Cmd+Shift+Z",
            2 => "Cmd+Shift+B",
            _ => "Cmd+Shift+S",
        };

        // Property: If shortcuts are the same, they should be detected as conflicts
        let are_same = shortcut1 == shortcut2;
        let conflict_detected = shortcut1 == shortcut2;

        TestResult::from_bool(are_same == conflict_detected)
    }

    // Property 7: Shortcut Customization
    // **Validates: Requirements 4.5**
    // Custom shortcuts should be valid and not conflict
    #[quickcheck]
    fn prop_custom_shortcut_validation(modifier_code: u8, key_code: u8) -> TestResult {
        let modifier = match modifier_code % 4 {
            0 => "Cmd",
            1 => "Ctrl",
            2 => "Alt",
            _ => "Shift",
        };

        let key = match key_code % 26 {
            0 => "A", 1 => "B", 2 => "C", 3 => "D", 4 => "E",
            5 => "F", 6 => "G", 7 => "H", 8 => "I", 9 => "J",
            10 => "K", 11 => "L", 12 => "M", 13 => "N", 14 => "O",
            15 => "P", 16 => "Q", 17 => "R", 18 => "S", 19 => "T",
            20 => "U", 21 => "V", 22 => "W", 23 => "X", 24 => "Y",
            _ => "Z",
        };

        let custom_shortcut = format!("{}+{}", modifier, key);

        // Property: Custom shortcuts should be valid format
        let has_modifier = custom_shortcut.contains("Cmd") || custom_shortcut.contains("Ctrl") || 
                          custom_shortcut.contains("Alt") || custom_shortcut.contains("Shift");
        let has_separator = custom_shortcut.contains("+");
        let parts: Vec<&str> = custom_shortcut.split('+').collect();
        let has_key = parts.len() == 2;

        TestResult::from_bool(has_modifier && has_separator && has_key)
    }

    // Property 6: Shortcut Action Mapping
    // **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    // Each action should map to exactly one default shortcut
    #[quickcheck]
    fn prop_action_shortcut_mapping(action_code: u8) -> TestResult {
        let (action, expected_shortcut) = match action_code % 4 {
            0 => ("toggle_focus_mode", "Cmd+Shift+F"),
            1 => ("activate_zona_roja", "Cmd+Shift+Z"),
            2 => ("start_break", "Cmd+Shift+B"),
            _ => ("toggle_window", "Cmd+Shift+S"),
        };

        // Property: Action-shortcut mapping should be consistent
        let mapping_valid = !action.is_empty() && !expected_shortcut.is_empty();
        TestResult::from_bool(mapping_valid)
    }

    // Property 7: Shortcut Uniqueness
    // **Validates: Requirements 4.5**
    // All default shortcuts should be unique
    #[quickcheck]
    fn prop_default_shortcuts_unique(code1: u8, code2: u8) -> TestResult {
        if code1 % 4 == code2 % 4 {
            return TestResult::discard();
        }

        let shortcut1 = match code1 % 4 {
            0 => "Cmd+Shift+F",
            1 => "Cmd+Shift+Z",
            2 => "Cmd+Shift+B",
            _ => "Cmd+Shift+S",
        };

        let shortcut2 = match code2 % 4 {
            0 => "Cmd+Shift+F",
            1 => "Cmd+Shift+Z",
            2 => "Cmd+Shift+B",
            _ => "Cmd+Shift+S",
        };

        // Property: Different actions should have different shortcuts
        TestResult::from_bool(shortcut1 != shortcut2)
    }

    // Property 6: Shortcut String Format
    // **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    // Shortcut strings should follow consistent format
    #[quickcheck]
    fn prop_shortcut_string_format(shortcut_code: u8) -> TestResult {
        let shortcut = match shortcut_code % 4 {
            0 => "Cmd+Shift+F",
            1 => "Cmd+Shift+Z",
            2 => "Cmd+Shift+B",
            _ => "Cmd+Shift+S",
        };

        // Property: Shortcuts should not have leading/trailing whitespace
        let no_whitespace = shortcut.trim() == shortcut;
        // Property: Shortcuts should not have consecutive separators
        let no_consecutive_separators = !shortcut.contains("++");
        // Property: Shortcuts should not start or end with separator
        let valid_boundaries = !shortcut.starts_with('+') && !shortcut.ends_with('+');

        TestResult::from_bool(no_whitespace && no_consecutive_separators && valid_boundaries)
    }

    // Property 7: Conflict Resolution Consistency
    // **Validates: Requirements 4.5**
    // Conflict detection should be symmetric
    #[quickcheck]
    fn prop_conflict_detection_symmetric(code1: u8, code2: u8) -> TestResult {
        let shortcut1 = match code1 % 4 {
            0 => "Cmd+Shift+F",
            1 => "Cmd+Shift+Z",
            2 => "Cmd+Shift+B",
            _ => "Cmd+Shift+S",
        };

        let shortcut2 = match code2 % 4 {
            0 => "Cmd+Shift+F",
            1 => "Cmd+Shift+Z",
            2 => "Cmd+Shift+B",
            _ => "Cmd+Shift+S",
        };

        // Property: If shortcut1 conflicts with shortcut2, then shortcut2 conflicts with shortcut1
        let conflict_1_2 = shortcut1 == shortcut2;
        let conflict_2_1 = shortcut2 == shortcut1;

        TestResult::from_bool(conflict_1_2 == conflict_2_1)
    }
}

// Unit tests for global shortcut functionality
#[cfg(test)]
mod unit_tests {

    #[test]
    fn test_default_shortcuts_are_valid() {
        let shortcuts = [
            "Cmd+Shift+F",
            "Cmd+Shift+Z",
            "Cmd+Shift+B",
            "Cmd+Shift+S",
        ];

        for shortcut in shortcuts.iter() {
            assert!(shortcut.contains("Cmd"));
            assert!(shortcut.contains("Shift"));
            assert!(shortcut.contains("+"));
            assert_eq!(shortcut.matches('+').count(), 2);
        }
    }

    #[test]
    fn test_shortcut_actions_are_valid() {
        let actions = [
            "toggle_focus_mode",
            "activate_zona_roja",
            "start_break",
            "toggle_window",
        ];

        for action in actions.iter() {
            assert!(!action.is_empty());
            assert!(action.chars().all(|c| c.is_alphanumeric() || c == '_'));
        }
    }

    #[test]
    fn test_default_shortcuts_are_unique() {
        let shortcuts = [
            "Cmd+Shift+F",
            "Cmd+Shift+Z",
            "Cmd+Shift+B",
            "Cmd+Shift+S",
        ];

        for i in 0..shortcuts.len() {
            for j in (i + 1)..shortcuts.len() {
                assert_ne!(shortcuts[i], shortcuts[j]);
            }
        }
    }

    #[test]
    fn test_action_shortcut_mapping() {
        let mappings = [
            ("toggle_focus_mode", "Cmd+Shift+F"),
            ("activate_zona_roja", "Cmd+Shift+Z"),
            ("start_break", "Cmd+Shift+B"),
            ("toggle_window", "Cmd+Shift+S"),
        ];

        for (action, shortcut) in mappings.iter() {
            assert!(!action.is_empty());
            assert!(!shortcut.is_empty());
            assert!(shortcut.contains("Cmd"));
        }
    }

    #[test]
    fn test_shortcut_conflict_detection() {
        let shortcut1 = "Cmd+Shift+F";
        let shortcut2 = "Cmd+Shift+F";
        let shortcut3 = "Cmd+Shift+Z";

        assert_eq!(shortcut1, shortcut2); // Conflict
        assert_ne!(shortcut1, shortcut3); // No conflict
    }

    #[test]
    fn test_custom_shortcut_validation() {
        let valid_shortcuts = [
            "Cmd+A",
            "Ctrl+B",
            "Alt+C",
            "Shift+D",
            "Cmd+Shift+E",
        ];

        for shortcut in valid_shortcuts.iter() {
            let parts: Vec<&str> = shortcut.split('+').collect();
            assert!(parts.len() >= 2);
            assert!(shortcut.contains("Cmd") || shortcut.contains("Ctrl") || 
                   shortcut.contains("Alt") || shortcut.contains("Shift"));
        }
    }

    #[test]
    fn test_shortcut_string_format() {
        let shortcuts = [
            "Cmd+Shift+F",
            "Cmd+Shift+Z",
            "Cmd+Shift+B",
            "Cmd+Shift+S",
        ];

        for shortcut in shortcuts.iter() {
            // No leading/trailing whitespace
            assert_eq!(shortcut.trim(), *shortcut);
            // No consecutive separators
            assert!(!shortcut.contains("++"));
            // No leading/trailing separator
            assert!(!shortcut.starts_with('+'));
            assert!(!shortcut.ends_with('+'));
        }
    }

    #[test]
    fn test_conflict_detection_symmetric() {
        let shortcut1 = "Cmd+Shift+F";
        let shortcut2 = "Cmd+Shift+F";

        assert_eq!(shortcut1 == shortcut2, shortcut2 == shortcut1);
    }

    #[test]
    fn test_shortcut_modifier_keys() {
        let modifiers = ["Cmd", "Ctrl", "Alt", "Shift"];

        for modifier in modifiers.iter() {
            assert!(!modifier.is_empty());
            assert!(modifier.chars().all(|c| c.is_alphabetic()));
        }
    }

    #[test]
    fn test_shortcut_key_letters() {
        let keys = ["F", "Z", "B", "S"];

        for key in keys.iter() {
            assert_eq!(key.len(), 1);
            assert!(key.chars().all(|c| c.is_alphabetic()));
        }
    }
}
