//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateSavedLocationDto {
  /// Returns a new [UpdateSavedLocationDto] instance.
  UpdateSavedLocationDto({
    this.description,
    this.icon,
    this.isFavorite,
    this.label,
    this.latitude,
    this.longitude,
    this.name,
    this.radius,
  });

  /// Optional description
  String? description;

  /// Icon identifier
  String? icon;

  /// Favorite status flag
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isFavorite;

  /// User signature label
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? label;

  /// Latitude (-90 to 90)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  double? latitude;

  /// Longitude (-180 to 180)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  double? longitude;

  /// Resolved geodata address name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  /// Radius in meters (10-5000)
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
  bool operator ==(Object other) => identical(this, other) || other is UpdateSavedLocationDto &&
    other.description == description &&
    other.icon == icon &&
    other.isFavorite == isFavorite &&
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
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (label == null ? 0 : label!.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (radius == null ? 0 : radius!.hashCode);

  @override
  String toString() => 'UpdateSavedLocationDto[description=$description, icon=$icon, isFavorite=$isFavorite, label=$label, latitude=$latitude, longitude=$longitude, name=$name, radius=$radius]';

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
    if (this.isFavorite != null) {
      json[r'isFavorite'] = this.isFavorite;
    } else {
    //  json[r'isFavorite'] = null;
    }
    if (this.label != null) {
      json[r'label'] = this.label;
    } else {
    //  json[r'label'] = null;
    }
    if (this.latitude != null) {
      json[r'latitude'] = this.latitude;
    } else {
    //  json[r'latitude'] = null;
    }
    if (this.longitude != null) {
      json[r'longitude'] = this.longitude;
    } else {
    //  json[r'longitude'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    if (this.radius != null) {
      json[r'radius'] = this.radius;
    } else {
    //  json[r'radius'] = null;
    }
    return json;
  }

  /// Returns a new [UpdateSavedLocationDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateSavedLocationDto? fromJson(dynamic value) {
    upgradeDto(value, "UpdateSavedLocationDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UpdateSavedLocationDto(
        description: mapValueOfType<String>(json, r'description'),
        icon: mapValueOfType<String>(json, r'icon'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        label: mapValueOfType<String>(json, r'label'),
        latitude: (mapValueOfType<num>(json, r'latitude'))?.toDouble(),
        longitude: (mapValueOfType<num>(json, r'longitude'))?.toDouble(),
        name: mapValueOfType<String>(json, r'name'),
        radius: mapValueOfType<int>(json, r'radius'),
      );
    }
    return null;
  }

  static List<UpdateSavedLocationDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateSavedLocationDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateSavedLocationDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateSavedLocationDto> mapFromJson(dynamic json) {
    final map = <String, UpdateSavedLocationDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateSavedLocationDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateSavedLocationDto-objects as value to a dart map
  static Map<String, List<UpdateSavedLocationDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateSavedLocationDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UpdateSavedLocationDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

