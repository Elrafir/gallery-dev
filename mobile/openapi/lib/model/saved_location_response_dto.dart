//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SavedLocationResponseDto {
  /// Returns a new [SavedLocationResponseDto] instance.
  SavedLocationResponseDto({
    required this.createdAt,
    required this.description,
    required this.icon,
    required this.id,
    required this.isFavorite,
    required this.label,
    required this.latitude,
    required this.longitude,
    required this.name,
    required this.radius,
    required this.updatedAt,
    required this.userId,
  });

  /// Creation timestamp
  DateTime createdAt;

  /// Optional description
  String? description;

  /// Icon identifier
  String? icon;

  /// Saved location ID
  String id;

  /// Favorite status flag
  bool isFavorite;

  /// User signature label
  String label;

  /// Latitude
  num latitude;

  /// Longitude
  num longitude;

  /// Resolved geodata address name
  String name;

  /// Radius in meters
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int radius;

  /// Update timestamp
  DateTime updatedAt;

  /// User ID
  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SavedLocationResponseDto &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.icon == icon &&
    other.id == id &&
    other.isFavorite == isFavorite &&
    other.label == label &&
    other.latitude == latitude &&
    other.longitude == longitude &&
    other.name == name &&
    other.radius == radius &&
    other.updatedAt == updatedAt &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (icon == null ? 0 : icon!.hashCode) +
    (id.hashCode) +
    (isFavorite.hashCode) +
    (label.hashCode) +
    (latitude.hashCode) +
    (longitude.hashCode) +
    (name.hashCode) +
    (radius.hashCode) +
    (updatedAt.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'SavedLocationResponseDto[createdAt=$createdAt, description=$description, icon=$icon, id=$id, isFavorite=$isFavorite, label=$label, latitude=$latitude, longitude=$longitude, name=$name, radius=$radius, updatedAt=$updatedAt, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
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
      json[r'id'] = this.id;
      json[r'isFavorite'] = this.isFavorite;
      json[r'label'] = this.label;
      json[r'latitude'] = this.latitude;
      json[r'longitude'] = this.longitude;
      json[r'name'] = this.name;
      json[r'radius'] = this.radius;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [SavedLocationResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SavedLocationResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SavedLocationResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SavedLocationResponseDto(
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        description: mapValueOfType<String>(json, r'description'),
        icon: mapValueOfType<String>(json, r'icon'),
        id: mapValueOfType<String>(json, r'id')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        label: mapValueOfType<String>(json, r'label')!,
        latitude: num.parse('${json[r'latitude']}'),
        longitude: num.parse('${json[r'longitude']}'),
        name: mapValueOfType<String>(json, r'name')!,
        radius: mapValueOfType<int>(json, r'radius')!,
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<SavedLocationResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SavedLocationResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SavedLocationResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SavedLocationResponseDto> mapFromJson(dynamic json) {
    final map = <String, SavedLocationResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SavedLocationResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SavedLocationResponseDto-objects as value to a dart map
  static Map<String, List<SavedLocationResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SavedLocationResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SavedLocationResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'description',
    'icon',
    'id',
    'isFavorite',
    'label',
    'latitude',
    'longitude',
    'name',
    'radius',
    'updatedAt',
    'userId',
  };
}

