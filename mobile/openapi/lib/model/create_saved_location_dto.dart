//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateSavedLocationDto {
  /// Returns a new [CreateSavedLocationDto] instance.
  CreateSavedLocationDto({
    this.description,
    this.icon,
    required this.label,
    required this.latitude,
    required this.longitude,
    required this.name,
    this.radius,
  });

  /// Optional description
  String? description;

  /// Icon identifier
  String? icon;

  /// User signature label
  String label;

  /// Latitude (-90 to 90)
  double latitude;

  /// Longitude (-180 to 180)
  double longitude;

  /// Resolved geodata address name
  String name;

  /// Radius in meters (10-5000, default 50)
  ///
  /// Minimum value: 10
  /// Maximum value: 5000
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  int? radius;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateSavedLocationDto &&
    other.description == description &&
    other.icon == icon &&
    other.label == label &&
    other.latitude == latitude &&
    other.longitude == longitude &&
    other.name == name &&
    other.radius == radius;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description == null ? 0 : description!.hashCode) +
    (icon == null ? 0 : icon!.hashCode) +
    (label.hashCode) +
    (latitude.hashCode) +
    (longitude.hashCode) +
    (name.hashCode) +
    (radius == null ? 0 : radius!.hashCode);

  @override
  String toString() => 'CreateSavedLocationDto[description=$description, icon=$icon, label=$label, latitude=$latitude, longitude=$longitude, name=$name, radius=$radius]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.icon != null) {
      json[r'icon'] = this.icon;
    } else {
    //  json[r'icon'] = null;
    }
      json[r'label'] = this.label;
      json[r'latitude'] = this.latitude;
      json[r'longitude'] = this.longitude;
      json[r'name'] = this.name;
    if (this.radius != null) {
      json[r'radius'] = this.radius;
    } else {
    //  json[r'radius'] = null;
    }
    return json;
  }

  /// Returns a new [CreateSavedLocationDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateSavedLocationDto? fromJson(dynamic value) {
    upgradeDto(value, "CreateSavedLocationDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CreateSavedLocationDto(
        description: mapValueOfType<String>(json, r'description'),
        icon: mapValueOfType<String>(json, r'icon'),
        label: mapValueOfType<String>(json, r'label')!,
        latitude: (mapValueOfType<num>(json, r'latitude')!).toDouble(),
        longitude: (mapValueOfType<num>(json, r'longitude')!).toDouble(),
        name: mapValueOfType<String>(json, r'name')!,
        radius: mapValueOfType<int>(json, r'radius'),
      );
    }
    return null;
  }

  static List<CreateSavedLocationDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateSavedLocationDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateSavedLocationDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateSavedLocationDto> mapFromJson(dynamic json) {
    final map = <String, CreateSavedLocationDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateSavedLocationDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateSavedLocationDto-objects as value to a dart map
  static Map<String, List<CreateSavedLocationDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateSavedLocationDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CreateSavedLocationDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'label',
    'latitude',
    'longitude',
    'name',
  };
}

