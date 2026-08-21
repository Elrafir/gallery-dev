//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigReverseGeocodingDto {
  /// Returns a new [SystemConfigReverseGeocodingDto] instance.
  SystemConfigReverseGeocodingDto({
    required this.enabled,
    this.geocoderUrl = 'http://192.168.100.78:8088',
    this.substitutions = const [],
  });

  /// Enabled
  bool enabled;

  /// Geocoder URL
  String geocoderUrl;

  /// Country substitution rules
  List<CountrySubstitutionRuleDto> substitutions;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigReverseGeocodingDto &&
    other.enabled == enabled &&
    other.geocoderUrl == geocoderUrl &&
    _deepEquality.equals(other.substitutions, substitutions);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (geocoderUrl.hashCode) +
    (substitutions.hashCode);

  @override
  String toString() => 'SystemConfigReverseGeocodingDto[enabled=$enabled, geocoderUrl=$geocoderUrl, substitutions=$substitutions]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'geocoderUrl'] = this.geocoderUrl;
      json[r'substitutions'] = this.substitutions;
    return json;
  }

  /// Returns a new [SystemConfigReverseGeocodingDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigReverseGeocodingDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigReverseGeocodingDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigReverseGeocodingDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        geocoderUrl: mapValueOfType<String>(json, r'geocoderUrl') ?? 'http://192.168.100.78:8088',
        substitutions: CountrySubstitutionRuleDto.listFromJson(json[r'substitutions']),
      );
    }
    return null;
  }

  static List<SystemConfigReverseGeocodingDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigReverseGeocodingDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigReverseGeocodingDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigReverseGeocodingDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigReverseGeocodingDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigReverseGeocodingDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigReverseGeocodingDto-objects as value to a dart map
  static Map<String, List<SystemConfigReverseGeocodingDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigReverseGeocodingDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigReverseGeocodingDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
  };
}

