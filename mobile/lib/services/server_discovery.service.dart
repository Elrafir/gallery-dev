import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class DiscoveredServer {
  final String ip;
  final int port;
  final String url;
  final String serverName;
  final String version;
  final int responseTimeMs;

  const DiscoveredServer({
    required this.ip,
    required this.port,
    required this.url,
    required this.serverName,
    required this.version,
    required this.responseTimeMs,
  });
}

class ServerDiscoveryService {
  static const List<int> defaultPorts = [2283, 3001, 8080, 80, 443];

  Future<List<String>> getLocalSubnets() async {
    final subnets = <String>[];
    try {
      final interfaces = await NetworkInterface.list(
        type: InternetAddressType.IPv4,
        includeLoopback: false,
      );

      for (final iface in interfaces) {
        for (final addr in iface.addresses) {
          final parts = addr.address.split('.');
          if (parts.length == 4) {
            final prefix = '${parts[0]}.${parts[1]}.${parts[2]}';
            if (!subnets.contains(prefix)) {
              subnets.add(prefix);
            }
          }
        }
      }
    } catch (_) {}

    return subnets;
  }

  Future<DiscoveredServer?> _probeServer(String ip, int port) async {
    final scheme = (port == 443) ? 'https' : 'http';
    final baseUrl = '$scheme://$ip:$port';
    final client = http.Client();
    final stopwatch = Stopwatch()..start();

    try {
      final uri = Uri.parse('$baseUrl/api/server/version');
      final response = await client.get(uri).timeout(const Duration(milliseconds: 400));
      stopwatch.stop();

      if (response.statusCode == 200) {
        String versionStr = '2.x';
        String serverName = 'Домашний фотоальбом';

        try {
          final data = json.decode(response.body);
          if (data is Map<String, dynamic>) {
            final major = data['major'];
            final minor = data['minor'];
            final patch = data['patch'];
            if (major != null) {
              versionStr = 'v$major.$minor.$patch';
            }
          }
        } catch (_) {}

        return DiscoveredServer(
          ip: ip,
          port: port,
          url: baseUrl,
          serverName: serverName,
          version: versionStr,
          responseTimeMs: stopwatch.elapsedMilliseconds,
        );
      }
    } catch (_) {
      // Not an active immich server
    } finally {
      client.close();
    }

    return null;
  }

  Stream<DiscoveredServer> scanSubnets({
    List<int> ports = defaultPorts,
  }) async* {
    final subnets = await getLocalSubnets();
    if (subnets.isEmpty) {
      return;
    }

    final controller = StreamController<DiscoveredServer>();

    // Scan port 2283 first across all hosts in parallel, then other ports
    for (final subnet in subnets) {
      for (final port in ports) {
        final futures = <Future<void>>[];

        for (int i = 1; i <= 254; i++) {
          final ip = '$subnet.$i';
          futures.add(
            _probeServer(ip, port).then((server) {
              if (server != null && !controller.isClosed) {
                controller.add(server);
              }
            }),
          );

          // Batch in chunks of 50 to avoid socket exhaustion
          if (futures.length >= 50) {
            await Future.wait(futures);
            futures.clear();
          }
        }

        if (futures.isNotEmpty) {
          await Future.wait(futures);
        }
      }
    }

    await controller.close();
    yield* controller.stream;
  }
}
