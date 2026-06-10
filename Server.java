import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;

/**
 * FoodExpress Java Static File Server
 *
 * Serves the web/ directory as the document root, with special routing:
 *   /         → web/index.html
 *   /db/*     → db/<file>  (SQL assets)
 *   /anything → web/anything
 *
 * CORS headers are added to every response so the Supabase JS client
 * can make cross-origin requests from the browser.
 *
 * Compile : javac Server.java
 * Run     : java Server
 */
public class Server {

    private static final int PORT = 8080;
    private static final String PROJECT_ROOT = System.getProperty("user.dir");

    public static void main(String[] args) throws IOException {

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/", new StaticFileHandler());
        server.setExecutor(null); // default executor

        // Graceful shutdown on Ctrl+C
        Runtime.getRuntime().addShutdownHook(new Thread(() ->
                System.out.println("\nServer stopped.")));

        System.out.println("=================================================");
        System.out.println("FoodExpress Java Web Server Starting...");
        System.out.println("Access UI at: http://localhost:" + PORT);
        System.out.println("=================================================");

        server.start();
    }

    // -----------------------------------------------------------------------
    // Static file request handler
    // -----------------------------------------------------------------------
    static class StaticFileHandler implements HttpHandler {

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();

            // Handle pre-flight OPTIONS requests (CORS)
            if ("OPTIONS".equalsIgnoreCase(method)) {
                addCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            // Strip query string, then resolve the target file
            String rawPath = exchange.getRequestURI().getPath();
            String cleanPath = rawPath.split("\\?")[0];

            File targetFile = resolvePath(cleanPath);

            if (targetFile.exists() && targetFile.isFile()) {
                byte[] bytes = Files.readAllBytes(targetFile.toPath());
                String mime = detectMimeType(targetFile.getName());

                addCorsHeaders(exchange);
                exchange.getResponseHeaders().set("Content-Type", mime);
                exchange.sendResponseHeaders(200, bytes.length);

                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                // 404
                byte[] msg = "404 Not Found".getBytes();
                addCorsHeaders(exchange);
                exchange.sendResponseHeaders(404, msg.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(msg);
                }
            }
        }

        /**
         * Mirrors the Python translate_path() logic:
         *   /         → web/index.html
         *   /db/*     → db/<rest>
         *   /anything → web/anything
         */
        private File resolvePath(String cleanPath) {
            if (cleanPath.equals("/")) {
                return new File(PROJECT_ROOT, "web/index.html");
            }
            if (cleanPath.startsWith("/db/")) {
                // Strip the leading '/' so we don't create an absolute path
                String relative = cleanPath.substring(1); // "db/filename.sql"
                return new File(PROJECT_ROOT, relative);
            }
            // Default: serve from web/ folder
            String stripped = cleanPath.startsWith("/") ? cleanPath.substring(1) : cleanPath;
            return new File(PROJECT_ROOT + File.separator + "web", stripped);
        }

        /** Add CORS headers to every response — equivalent to Python end_headers(). */
        private void addCorsHeaders(HttpExchange exchange) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin",  "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
        }

        // Basic MIME type map
        private static final Map<String, String> MIME_TYPES = new HashMap<>();
        static {
            MIME_TYPES.put("html", "text/html; charset=utf-8");
            MIME_TYPES.put("htm",  "text/html; charset=utf-8");
            MIME_TYPES.put("css",  "text/css; charset=utf-8");
            MIME_TYPES.put("js",   "application/javascript; charset=utf-8");
            MIME_TYPES.put("json", "application/json; charset=utf-8");
            MIME_TYPES.put("sql",  "text/plain; charset=utf-8");
            MIME_TYPES.put("png",  "image/png");
            MIME_TYPES.put("jpg",  "image/jpeg");
            MIME_TYPES.put("jpeg", "image/jpeg");
            MIME_TYPES.put("gif",  "image/gif");
            MIME_TYPES.put("svg",  "image/svg+xml");
            MIME_TYPES.put("ico",  "image/x-icon");
            MIME_TYPES.put("woff",  "font/woff");
            MIME_TYPES.put("woff2", "font/woff2");
            MIME_TYPES.put("ttf",   "font/ttf");
        }

        private String detectMimeType(String filename) {
            int dot = filename.lastIndexOf('.');
            if (dot >= 0) {
                String ext = filename.substring(dot + 1).toLowerCase();
                return MIME_TYPES.getOrDefault(ext, "application/octet-stream");
            }
            return "application/octet-stream";
        }
    }
}
