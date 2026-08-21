//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceMemberPreferencesDto {
  /// Returns a new [SharedSpaceMemberPreferencesDto] instance.
  SharedSpaceMemberPreferencesDto({
    this.inheritPeople,
    this.inheritTags,
    this.sharePersonMetadata,
    this.showInMap,
    this.showInMemories,
    this.showInTimeline,
  });

  /// Inherit base people from system space
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? inheritPeople;

  /// Inherit base tags from system space
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? inheritTags;

  /// Share person names and birth dates with this space
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? sharePersonMetadata;

  /// Show system space content on map
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? showInMap;

  /// Show system space content in memories
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? showInMemories;

  /// Show space assets in personal timeline
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? showInTimeline;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceMemberPreferencesDto &&
    other.inheritPeople == inheritPeople &&
    other.inheritTags == inheritTags &&
    other.sharePersonMetadata == sharePersonMetadata &&
    other.showInMap == showInMap &&
    other.showInMemories == showInMemories &&
    other.showInTimeline == showInTimeline;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (inheritPeople == null ? 0 : inheritPeople!.hashCode) +
    (inheritTags == null ? 0 : inheritTags!.hashCode) +
    (sharePersonMetadata == null ? 0 : sharePersonMetadata!.hashCode) +
    (showInMap == null ? 0 : showInMap!.hashCode) +
    (showInMemories == null ? 0 : showInMemories!.hashCode) +
    (showInTimeline == null ? 0 : showInTimeline!.hashCode);

  @override
  String toString() => 'SharedSpaceMemberPreferencesDto[inheritPeople=$inheritPeople, inheritTags=$inheritTags, sharePersonMetadata=$sharePersonMetadata, showInMap=$showInMap, showInMemories=$showInMemories, showInTimeline=$showInTimeline]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.inheritPeople != null) {
      json[r'inheritPeople'] = this.inheritPeople;
    } else {
    //  json[r'inheritPeople'] = null;
    }
    if (this.inheritTags != null) {
      json[r'inheritTags'] = this.inheritTags;
    } else {
    //  json[r'inheritTags'] = null;
    }
    if (this.sharePersonMetadata != null) {
      json[r'sharePersonMetadata'] = this.sharePersonMetadata;
    } else {
    //  json[r'sharePersonMetadata'] = null;
    }
    if (this.showInMap != null) {
      json[r'showInMap'] = this.showInMap;
    } else {
    //  json[r'showInMap'] = null;
    }
    if (this.showInMemories != null) {
      json[r'showInMemories'] = this.showInMemories;
    } else {
    //  json[r'showInMemories'] = null;
    }
    if (this.showInTimeline != null) {
      json[r'showInTimeline'] = this.showInTimeline;
    } else {
    //  json[r'showInTimeline'] = null;
    }
    return json;
  }

  /// Returns a new [SharedSpaceMemberPreferencesDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceMemberPreferencesDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceMemberPreferencesDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceMemberPreferencesDto(
        inheritPeople: mapValueOfType<bool>(json, r'inheritPeople'),
        inheritTags: mapValueOfType<bool>(json, r'inheritTags'),
        sharePersonMetadata: mapValueOfType<bool>(json, r'sharePersonMetadata'),
        showInMap: mapValueOfType<bool>(json, r'showInMap'),
        showInMemories: mapValueOfType<bool>(json, r'showInMemories'),
        showInTimeline: mapValueOfType<bool>(json, r'showInTimeline'),
      );
    }
    return null;
  }

  static List<SharedSpaceMemberPreferencesDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceMemberPreferencesDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceMemberPreferencesDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceMemberPreferencesDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceMemberPreferencesDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceMemberPreferencesDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceMemberPreferencesDto-objects as value to a dart map
  static Map<String, List<SharedSpaceMemberPreferencesDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceMemberPreferencesDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceMemberPreferencesDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

