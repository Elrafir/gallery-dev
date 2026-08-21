//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SavedLocationsApi {
  SavedLocationsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create a saved location
  ///
  /// Create a new saved location for the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [CreateSavedLocationDto] createSavedLocationDto (required):
  Future<Response> createWithHttpInfo(CreateSavedLocationDto createSavedLocationDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/saved-locations';

    // ignore: prefer_final_locals
    Object? postBody = createSavedLocationDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Create a saved location
  ///
  /// Create a new saved location for the authenticated user.
  ///
  /// Parameters:
  ///
  /// * [CreateSavedLocationDto] createSavedLocationDto (required):
  Future<SavedLocationResponseDto?> create(CreateSavedLocationDto createSavedLocationDto,) async {
    final response = await createWithHttpInfo(createSavedLocationDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SavedLocationResponseDto',) as SavedLocationResponseDto;
    
    }
    return null;
  }

  /// Delete a saved location
  ///
  /// Delete a saved location by ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/saved-locations/{id}'
      .replaceAll('{id}', id);

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

  /// Delete a saved location
  ///
  /// Delete a saved location by ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> delete(String id,) async {
    final response = await deleteWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Find saved locations by proximity
  ///
  /// Find all saved locations whose radius covers the given GPS point.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [double] latitude (required):
  ///   Asset latitude
  ///
  /// * [double] longitude (required):
  ///   Asset longitude
  Future<Response> findByProximityWithHttpInfo(double latitude, double longitude,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/saved-locations/proximity';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'latitude', latitude));
      queryParams.addAll(_queryParams('', 'longitude', longitude));

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

  /// Find saved locations by proximity
  ///
  /// Find all saved locations whose radius covers the given GPS point.
  ///
  /// Parameters:
  ///
  /// * [double] latitude (required):
  ///   Asset latitude
  ///
  /// * [double] longitude (required):
  ///   Asset longitude
  Future<List<SavedLocationResponseDto>?> findByProximity(double latitude, double longitude,) async {
    final response = await findByProximityWithHttpInfo(latitude, longitude,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SavedLocationResponseDto>') as List)
        .cast<SavedLocationResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Get all saved locations
  ///
  /// Retrieve all saved locations for the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAllWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/saved-locations';

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

  /// Get all saved locations
  ///
  /// Retrieve all saved locations for the authenticated user.
  Future<List<SavedLocationResponseDto>?> getAll() async {
    final response = await getAllWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SavedLocationResponseDto>') as List)
        .cast<SavedLocationResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Update a saved location
  ///
  /// Update an existing saved location by ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateSavedLocationDto] updateSavedLocationDto (required):
  Future<Response> updateWithHttpInfo(String id, UpdateSavedLocationDto updateSavedLocationDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/saved-locations/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = updateSavedLocationDto;

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

  /// Update a saved location
  ///
  /// Update an existing saved location by ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateSavedLocationDto] updateSavedLocationDto (required):
  Future<SavedLocationResponseDto?> update(String id, UpdateSavedLocationDto updateSavedLocationDto,) async {
    final response = await updateWithHttpInfo(id, updateSavedLocationDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SavedLocationResponseDto',) as SavedLocationResponseDto;
    
    }
    return null;
  }
}
