//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SystemConfigApi {
  SystemConfigApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Add shared user
  ///
  /// Добавить пользователя как источник фото. Все его фото станут видны участникам PL.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] userId (required):
  Future<Response> addSharedUserWithHttpInfo(String userId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/shared-users/{userId}'
      .replaceAll('{userId}', userId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Add shared user
  ///
  /// Добавить пользователя как источник фото. Все его фото станут видны участникам PL.
  ///
  /// Parameters:
  ///
  /// * [String] userId (required):
  Future<void> addSharedUser(String userId,) async {
    final response = await addSharedUserWithHttpInfo(userId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Link tags to Primary Library
  ///
  /// Привязать теги к базовой библиотеке.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> addSpaceTagsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/tags';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Link tags to Primary Library
  ///
  /// Привязать теги к базовой библиотеке.
  Future<void> addSpaceTags() async {
    final response = await addSpaceTagsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Enroll all existing users
  ///
  /// Зачислить всех существующих пользователей в базовую библиотеку.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> enrollAllUsersWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/members/enroll-all';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Enroll all existing users
  ///
  /// Зачислить всех существующих пользователей в базовую библиотеку.
  Future<num?> enrollAllUsers() async {
    final response = await enrollAllUsersWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'num',) as num;
    
    }
    return null;
  }

  /// Enroll a single user
  ///
  /// Вручную зачислить конкретного пользователя в базовую библиотеку.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] userId (required):
  Future<Response> enrollUserWithHttpInfo(String userId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/members/{userId}/enroll'
      .replaceAll('{userId}', userId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Enroll a single user
  ///
  /// Вручную зачислить конкретного пользователя в базовую библиотеку.
  ///
  /// Parameters:
  ///
  /// * [String] userId (required):
  Future<void> enrollUser(String userId,) async {
    final response = await enrollUserWithHttpInfo(userId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get system configuration
  ///
  /// Retrieve the current system configuration.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getConfigWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/system-config';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get system configuration
  ///
  /// Retrieve the current system configuration.
  Future<SystemConfigDto?> getConfig() async {
    final response = await getConfigWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SystemConfigDto',) as SystemConfigDto;
    
    }
    return null;
  }

  /// Get system configuration defaults
  ///
  /// Retrieve the default values for the system configuration.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getConfigDefaultsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/system-config/defaults';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get system configuration defaults
  ///
  /// Retrieve the default values for the system configuration.
  Future<SystemConfigDto?> getConfigDefaults() async {
    final response = await getConfigDefaultsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SystemConfigDto',) as SystemConfigDto;
    
    }
    return null;
  }

  /// Get linked libraries
  ///
  /// Получить список привязанных библиотек.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getLinkedLibrariesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/libraries';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get linked libraries
  ///
  /// Получить список привязанных библиотек.
  Future<void> getLinkedLibraries() async {
    final response = await getLinkedLibrariesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get Primary Library members
  ///
  /// Получить список участников базовой библиотеки.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getMembersWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/members';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get Primary Library members
  ///
  /// Получить список участников базовой библиотеки.
  Future<void> getMembers() async {
    final response = await getMembersWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get Primary Library settings
  ///
  /// Получить текущие настройки базовой библиотеки.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSettingsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/settings';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get Primary Library settings
  ///
  /// Получить текущие настройки базовой библиотеки.
  Future<Object?> getSettings() async {
    final response = await getSettingsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'Object',) as Object;
    
    }
    return null;
  }

  /// Get shared users
  ///
  /// Получить список пользователей, чьи фото расшарены через PL.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSharedUsersWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/shared-users';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get shared users
  ///
  /// Получить список пользователей, чьи фото расшарены через PL.
  Future<void> getSharedUsers() async {
    final response = await getSharedUsersWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get linked tags
  ///
  /// Получить список тегов, привязанных к базовой библиотеке.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSpaceTagsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/tags';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get linked tags
  ///
  /// Получить список тегов, привязанных к базовой библиотеке.
  Future<void> getSpaceTags() async {
    final response = await getSpaceTagsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get storage template options
  ///
  /// Retrieve exemplary storage template options.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getStorageTemplateOptionsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/system-config/storage-template-options';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get storage template options
  ///
  /// Retrieve exemplary storage template options.
  Future<SystemConfigTemplateStorageOptionDto?> getStorageTemplateOptions() async {
    final response = await getStorageTemplateOptionsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SystemConfigTemplateStorageOptionDto',) as SystemConfigTemplateStorageOptionDto;
    
    }
    return null;
  }

  /// Link libraries to Primary Library
  ///
  /// Привязать библиотеки администратора к базовой библиотеке.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> linkLibrariesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/libraries';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Link libraries to Primary Library
  ///
  /// Привязать библиотеки администратора к базовой библиотеке.
  Future<void> linkLibraries() async {
    final response = await linkLibrariesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Remove user from Primary Library
  ///
  /// Удалить пользователя из базовой библиотеки.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] userId (required):
  Future<Response> removeMemberWithHttpInfo(String userId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/members/{userId}'
      .replaceAll('{userId}', userId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Remove user from Primary Library
  ///
  /// Удалить пользователя из базовой библиотеки.
  ///
  /// Parameters:
  ///
  /// * [String] userId (required):
  Future<void> removeMember(String userId,) async {
    final response = await removeMemberWithHttpInfo(userId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Remove shared user
  ///
  /// Убрать пользователя из источников фото PL.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] userId (required):
  Future<Response> removeSharedUserWithHttpInfo(String userId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/shared-users/{userId}'
      .replaceAll('{userId}', userId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Remove shared user
  ///
  /// Убрать пользователя из источников фото PL.
  ///
  /// Parameters:
  ///
  /// * [String] userId (required):
  Future<void> removeSharedUser(String userId,) async {
    final response = await removeSharedUserWithHttpInfo(userId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Sync faces for Primary Library
  ///
  /// Запустить синхронизацию распознанных лиц для базовой библиотеки.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> syncFacesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/sync-faces';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Sync faces for Primary Library
  ///
  /// Запустить синхронизацию распознанных лиц для базовой библиотеки.
  Future<void> syncFaces() async {
    final response = await syncFacesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Unlink libraries from Primary Library
  ///
  /// Отвязать библиотеки от базовой библиотеки.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> unlinkLibrariesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/libraries';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Unlink libraries from Primary Library
  ///
  /// Отвязать библиотеки от базовой библиотеки.
  Future<void> unlinkLibraries() async {
    final response = await unlinkLibrariesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Unlink tags from Primary Library
  ///
  /// Отвязать теги от базовой библиотеки.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> unlinkSpaceTagsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/tags';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Unlink tags from Primary Library
  ///
  /// Отвязать теги от базовой библиотеки.
  Future<void> unlinkSpaceTags() async {
    final response = await unlinkSpaceTagsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Update system configuration
  ///
  /// Update the system configuration with a new system configuration.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [SystemConfigDto] systemConfigDto (required):
  Future<Response> updateConfigWithHttpInfo(SystemConfigDto systemConfigDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/system-config';

    // ignore: prefer_final_locals
    Object? postBody = systemConfigDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Update system configuration
  ///
  /// Update the system configuration with a new system configuration.
  ///
  /// Parameters:
  ///
  /// * [SystemConfigDto] systemConfigDto (required):
  Future<SystemConfigDto?> updateConfig(SystemConfigDto systemConfigDto,) async {
    final response = await updateConfigWithHttpInfo(systemConfigDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SystemConfigDto',) as SystemConfigDto;
    
    }
    return null;
  }

  /// Update Primary Library member settings
  ///
  /// Обновить настройки участника базовой библиотеки.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] userId (required):
  Future<Response> updateMemberWithHttpInfo(String userId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/members/{userId}'
      .replaceAll('{userId}', userId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Update Primary Library member settings
  ///
  /// Обновить настройки участника базовой библиотеки.
  ///
  /// Parameters:
  ///
  /// * [String] userId (required):
  Future<void> updateMember(String userId,) async {
    final response = await updateMemberWithHttpInfo(userId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Update Primary Library settings
  ///
  /// Обновить настройки базовой библиотеки. Создаёт системное пространство при первом включении.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateSettingsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/primary-library/settings';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Update Primary Library settings
  ///
  /// Обновить настройки базовой библиотеки. Создаёт системное пространство при первом включении.
  Future<Object?> updateSettings() async {
    final response = await updateSettingsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'Object',) as Object;
    
    }
    return null;
  }
}
