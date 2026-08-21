//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CountrySubstitutionRuleDto {
  /// Returns a new [CountrySubstitutionRuleDto] instance.
  CountrySubstitutionRuleDto({
    required this.country,
    this.endYear,
    this.replacement,
    this.replacementCountry,
    this.replacementState,
    this.startYear,
    required this.state,
  });

  /// Original country name
  String country;

  /// End year (inclusive)
  ///
  /// Minimum value: 1000
  /// Maximum value: 3000
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  int? endYear;

  /// Replacement country name (legacy)
  String? replacement;

  /// Replacement country name
  String? replacementCountry;

  /// Replacement state/region name
  String? replacementState;

  /// Start year (inclusive)
  ///
  /// Minimum value: 1000
  /// Maximum value: 3000
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  int? startYear;

  /// Original state/region/republic name
  String state;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CountrySubstitutionRuleDto &&
    other.country == country &&
    other.endYear == endYear &&
    other.replacement == replacement &&
    other.replacementCountry == replacementCountry &&
    other.replacementState == replacementState &&
    other.startYear == startYear &&
    other.state == state;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (country.hashCode) +
    (endYear == null ? 0 : endYear!.hashCode) +
    (replacement == null ? 0 : replacement!.hashCode) +
    (replacementCountry == null ? 0 : replacementCountry!.hashCode) +
    (replacementState == null ? 0 : replacementState!.hashCode) +
    (startYear == null ? 0 : startYear!.hashCode) +
    (state.hashCode);

  @override
  String toString() => 'CountrySubstitutionRuleDto[country=$country, endYear=$endYear, replacement=$replacement, replacementCountry=$replacementCountry, replacementState=$replacementState, startYear=$startYear, state=$state]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'country'] = this.country;
    if (this.endYear != null) {
      json[r'endYear'] = this.endYear;
    } else {
    //  json[r'endYear'] = null;
    }
    if (this.replacement != null) {
      json[r'replacement'] = this.replacement;
    } else {
    //  json[r'replacement'] = null;
    }
    if (this.replacementCountry != null) {
      json[r'replacementCountry'] = this.replacementCountry;
    } else {
    //  json[r'replacementCountry'] = null;
    }
    if (this.replacementState != null) {
      json[r'replacementState'] = this.replacementState;
    } else {
    //  json[r'replacementState'] = null;
    }
    if (this.startYear != null) {
      json[r'startYear'] = this.startYear;
    } else {
    //  json[r'startYear'] = null;
    }
      json[r'state'] = this.state;
    return json;
  }

  /// Returns a new [CountrySubstitutionRuleDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CountrySubstitutionRuleDto? fromJson(dynamic value) {
    upgradeDto(value, "CountrySubstitutionRuleDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CountrySubstitutionRuleDto(
        country: mapValueOfType<String>(json, r'country')!,
        endYear: mapValueOfType<int>(json, r'endYear'),
        replacement: mapValueOfType<String>(json, r'replacement'),
        replacementCountry: mapValueOfType<String>(json, r'replacementCountry'),
        replacementState: mapValueOfType<String>(json, r'replacementState'),
        startYear: mapValueOfType<int>(json, r'startYear'),
        state: mapValueOfType<String>(json, r'state')!,
      );
    }
    return null;
  }

  static List<CountrySubstitutionRuleDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CountrySubstitutionRuleDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CountrySubstitutionRuleDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CountrySubstitutionRuleDto> mapFromJson(dynamic json) {
    final map = <String, CountrySubstitutionRuleDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CountrySubstitutionRuleDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CountrySubstitutionRuleDto-objects as value to a dart map
  static Map<String, List<CountrySubstitutionRuleDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CountrySubstitutionRuleDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CountrySubstitutionRuleDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'country',
    'state',
  };
}

