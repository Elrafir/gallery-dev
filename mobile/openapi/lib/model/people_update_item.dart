//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PeopleUpdateItem {
  /// Returns a new [PeopleUpdateItem] instance.
  PeopleUpdateItem({
    this.birthDate,
    this.color,
    this.description,
    this.featureFaceAssetId,
    required this.id,
    this.isFavorite,
    this.isHidden,
    this.name,
    this.species,
    this.type,
  });

  /// Person date of birth
  DateTime? birthDate;

  /// Person color (hex)
  String? color;

  /// Extended notes about this person
  String? description;

  /// Asset ID used for feature face thumbnail
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? featureFaceAssetId;

  /// Person ID
  String id;

  /// Mark as favorite
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isFavorite;

  /// Person visibility (hidden)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isHidden;

  /// Person name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  /// Pet species (e.g. dog, cat); only used when type is pet
  String? species;

  /// Entity type (person or pet)
  PeopleUpdateItemTypeEnum? type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PeopleUpdateItem &&
    other.birthDate == birthDate &&
    other.color == color &&
    other.description == description &&
    other.featureFaceAssetId == featureFaceAssetId &&
    other.id == id &&
    other.isFavorite == isFavorite &&
    other.isHidden == isHidden &&
    other.name == name &&
    other.species == species &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (color == null ? 0 : color!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (featureFaceAssetId == null ? 0 : featureFaceAssetId!.hashCode) +
    (id.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isHidden == null ? 0 : isHidden!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (species == null ? 0 : species!.hashCode) +
    (type == null ? 0 : type!.hashCode);

  @override
  String toString() => 'PeopleUpdateItem[birthDate=$birthDate, color=$color, description=$description, featureFaceAssetId=$featureFaceAssetId, id=$id, isFavorite=$isFavorite, isHidden=$isHidden, name=$name, species=$species, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.birthDate != null) {
      json[r'birthDate'] = _dateFormatter.format(this.birthDate!);
    } else {
    //  json[r'birthDate'] = null;
    }
    if (this.color != null) {
      json[r'color'] = this.color;
    } else {
    //  json[r'color'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.featureFaceAssetId != null) {
      json[r'featureFaceAssetId'] = this.featureFaceAssetId;
    } else {
    //  json[r'featureFaceAssetId'] = null;
    }
      json[r'id'] = this.id;
    if (this.isFavorite != null) {
      json[r'isFavorite'] = this.isFavorite;
    } else {
    //  json[r'isFavorite'] = null;
    }
    if (this.isHidden != null) {
      json[r'isHidden'] = this.isHidden;
    } else {
    //  json[r'isHidden'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    if (this.species != null) {
      json[r'species'] = this.species;
    } else {
    //  json[r'species'] = null;
    }
    if (this.type != null) {
      json[r'type'] = this.type;
    } else {
    //  json[r'type'] = null;
    }
    return json;
  }

  /// Returns a new [PeopleUpdateItem] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PeopleUpdateItem? fromJson(dynamic value) {
    upgradeDto(value, "PeopleUpdateItem");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PeopleUpdateItem(
        birthDate: mapDateTime(json, r'birthDate', r''),
        color: mapValueOfType<String>(json, r'color'),
        description: mapValueOfType<String>(json, r'description'),
        featureFaceAssetId: mapValueOfType<String>(json, r'featureFaceAssetId'),
        id: mapValueOfType<String>(json, r'id')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        isHidden: mapValueOfType<bool>(json, r'isHidden'),
        name: mapValueOfType<String>(json, r'name'),
        species: mapValueOfType<String>(json, r'species'),
        type: PeopleUpdateItemTypeEnum.fromJson(json[r'type']),
      );
    }
    return null;
  }

  static List<PeopleUpdateItem> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PeopleUpdateItem>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PeopleUpdateItem.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PeopleUpdateItem> mapFromJson(dynamic json) {
    final map = <String, PeopleUpdateItem>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PeopleUpdateItem.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PeopleUpdateItem-objects as value to a dart map
  static Map<String, List<PeopleUpdateItem>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PeopleUpdateItem>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PeopleUpdateItem.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
  };
}

/// Entity type (person or pet)
class PeopleUpdateItemTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const PeopleUpdateItemTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const person = PeopleUpdateItemTypeEnum._(r'person');
  static const pet = PeopleUpdateItemTypeEnum._(r'pet');

  /// List of all possible values in this [enum][PeopleUpdateItemTypeEnum].
  static const values = <PeopleUpdateItemTypeEnum>[
    person,
    pet,
  ];

  static PeopleUpdateItemTypeEnum? fromJson(dynamic value) => PeopleUpdateItemTypeEnumTypeTransformer().decode(value);

  static List<PeopleUpdateItemTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PeopleUpdateItemTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PeopleUpdateItemTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PeopleUpdateItemTypeEnum] to String,
/// and [decode] dynamic data back to [PeopleUpdateItemTypeEnum].
class PeopleUpdateItemTypeEnumTypeTransformer {
  factory PeopleUpdateItemTypeEnumTypeTransformer() => _instance ??= const PeopleUpdateItemTypeEnumTypeTransformer._();

  const PeopleUpdateItemTypeEnumTypeTransformer._();

  String encode(PeopleUpdateItemTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a PeopleUpdateItemTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PeopleUpdateItemTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'person': return PeopleUpdateItemTypeEnum.person;
        case r'pet': return PeopleUpdateItemTypeEnum.pet;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PeopleUpdateItemTypeEnumTypeTransformer] instance.
  static PeopleUpdateItemTypeEnumTypeTransformer? _instance;
}


