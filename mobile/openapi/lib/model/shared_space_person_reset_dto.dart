//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpacePersonResetDto {
  /// Returns a new [SharedSpacePersonResetDto] instance.
  SharedSpacePersonResetDto({
    this.alias,
    this.birthDate,
    this.description,
    this.name,
    this.thumbnail,
  });

  /// Remove per-user alias overrides
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? alias;

  /// Reset birth date to inherited value
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? birthDate;

  /// Reset description to default
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? description;

  /// Reset name to inherited value
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? name;

  /// Reset thumbnail to auto-selected
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? thumbnail;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpacePersonResetDto &&
    other.alias == alias &&
    other.birthDate == birthDate &&
    other.description == description &&
    other.name == name &&
    other.thumbnail == thumbnail;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (alias == null ? 0 : alias!.hashCode) +
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (thumbnail == null ? 0 : thumbnail!.hashCode);

  @override
  String toString() => 'SharedSpacePersonResetDto[alias=$alias, birthDate=$birthDate, description=$description, name=$name, thumbnail=$thumbnail]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.alias != null) {
      json[r'alias'] = this.alias;
    } else {
    //  json[r'alias'] = null;
    }
    if (this.birthDate != null) {
      json[r'birthDate'] = this.birthDate;
    } else {
    //  json[r'birthDate'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    if (this.thumbnail != null) {
      json[r'thumbnail'] = this.thumbnail;
    } else {
    //  json[r'thumbnail'] = null;
    }
    return json;
  }

  /// Returns a new [SharedSpacePersonResetDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpacePersonResetDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpacePersonResetDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpacePersonResetDto(
        alias: mapValueOfType<bool>(json, r'alias'),
        birthDate: mapValueOfType<bool>(json, r'birthDate'),
        description: mapValueOfType<bool>(json, r'description'),
        name: mapValueOfType<bool>(json, r'name'),
        thumbnail: mapValueOfType<bool>(json, r'thumbnail'),
      );
    }
    return null;
  }

  static List<SharedSpacePersonResetDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpacePersonResetDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpacePersonResetDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpacePersonResetDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpacePersonResetDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpacePersonResetDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpacePersonResetDto-objects as value to a dart map
  static Map<String, List<SharedSpacePersonResetDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpacePersonResetDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpacePersonResetDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

