//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonCreateDto {
  /// Returns a new [PersonCreateDto] instance.
  PersonCreateDto({
    this.birthDate,
    this.color,
    this.description,
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
  PersonCreateDtoTypeEnum? type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PersonCreateDto &&
    other.birthDate == birthDate &&
    other.color == color &&
    other.description == description &&
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
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isHidden == null ? 0 : isHidden!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (species == null ? 0 : species!.hashCode) +
    (type == null ? 0 : type!.hashCode);

  @override
  String toString() => 'PersonCreateDto[birthDate=$birthDate, color=$color, description=$description, isFavorite=$isFavorite, isHidden=$isHidden, name=$name, species=$species, type=$type]';

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

  /// Returns a new [PersonCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "PersonCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonCreateDto(
        birthDate: mapDateTime(json, r'birthDate', r''),
        color: mapValueOfType<String>(json, r'color'),
        description: mapValueOfType<String>(json, r'description'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        isHidden: mapValueOfType<bool>(json, r'isHidden'),
        name: mapValueOfType<String>(json, r'name'),
        species: mapValueOfType<String>(json, r'species'),
        type: PersonCreateDtoTypeEnum.fromJson(json[r'type']),
      );
    }
    return null;
  }

  static List<PersonCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PersonCreateDto> mapFromJson(dynamic json) {
    final map = <String, PersonCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PersonCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PersonCreateDto-objects as value to a dart map
  static Map<String, List<PersonCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PersonCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PersonCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

/// Entity type (person or pet)
class PersonCreateDtoTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const PersonCreateDtoTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const person = PersonCreateDtoTypeEnum._(r'person');
  static const pet = PersonCreateDtoTypeEnum._(r'pet');

  /// List of all possible values in this [enum][PersonCreateDtoTypeEnum].
  static const values = <PersonCreateDtoTypeEnum>[
    person,
    pet,
  ];

  static PersonCreateDtoTypeEnum? fromJson(dynamic value) => PersonCreateDtoTypeEnumTypeTransformer().decode(value);

  static List<PersonCreateDtoTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonCreateDtoTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonCreateDtoTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PersonCreateDtoTypeEnum] to String,
/// and [decode] dynamic data back to [PersonCreateDtoTypeEnum].
class PersonCreateDtoTypeEnumTypeTransformer {
  factory PersonCreateDtoTypeEnumTypeTransformer() => _instance ??= const PersonCreateDtoTypeEnumTypeTransformer._();

  const PersonCreateDtoTypeEnumTypeTransformer._();

  String encode(PersonCreateDtoTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a PersonCreateDtoTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PersonCreateDtoTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'person': return PersonCreateDtoTypeEnum.person;
        case r'pet': return PersonCreateDtoTypeEnum.pet;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PersonCreateDtoTypeEnumTypeTransformer] instance.
  static PersonCreateDtoTypeEnumTypeTransformer? _instance;
}


