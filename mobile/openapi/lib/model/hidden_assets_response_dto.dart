//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class HiddenAssetsResponseDto {
  /// Returns a new [HiddenAssetsResponseDto] instance.
  HiddenAssetsResponseDto({
    this.assets = const [],
    required this.hasNextPage,
    required this.page,
    required this.size,
    required this.total,
  });

  /// Список скрытых медиафайлов
  List<Object?> assets;

  /// Есть ли следующая страница
  bool hasNextPage;

  /// Текущая страница
  num page;

  /// Размер страницы
  num size;

  /// Общее количество скрытых
  num total;

  @override
  bool operator ==(Object other) => identical(this, other) || other is HiddenAssetsResponseDto &&
    _deepEquality.equals(other.assets, assets) &&
    other.hasNextPage == hasNextPage &&
    other.page == page &&
    other.size == size &&
    other.total == total;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assets.hashCode) +
    (hasNextPage.hashCode) +
    (page.hashCode) +
    (size.hashCode) +
    (total.hashCode);

  @override
  String toString() => 'HiddenAssetsResponseDto[assets=$assets, hasNextPage=$hasNextPage, page=$page, size=$size, total=$total]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assets'] = this.assets;
      json[r'hasNextPage'] = this.hasNextPage;
      json[r'page'] = this.page;
      json[r'size'] = this.size;
      json[r'total'] = this.total;
    return json;
  }

  /// Returns a new [HiddenAssetsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static HiddenAssetsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "HiddenAssetsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return HiddenAssetsResponseDto(
        assets: json[r'assets'] is List ? (json[r'assets'] as List).cast<Object?>() : const [],
        hasNextPage: mapValueOfType<bool>(json, r'hasNextPage')!,
        page: num.parse('${json[r'page']}'),
        size: num.parse('${json[r'size']}'),
        total: num.parse('${json[r'total']}'),
      );
    }
    return null;
  }

  static List<HiddenAssetsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <HiddenAssetsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = HiddenAssetsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, HiddenAssetsResponseDto> mapFromJson(dynamic json) {
    final map = <String, HiddenAssetsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = HiddenAssetsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of HiddenAssetsResponseDto-objects as value to a dart map
  static Map<String, List<HiddenAssetsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<HiddenAssetsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = HiddenAssetsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assets',
    'hasNextPage',
    'page',
    'size',
    'total',
  };
}

