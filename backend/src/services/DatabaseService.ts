import { MongoClient, ServerApiVersion, Db } from 'mongodb';
import { promises as dns } from 'dns';

// Set public DNS servers to resolve external domains
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

class DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<void> {
    try {
      const uri = process.env.DATABASE_URL;
      if (!uri) {
        console.log('No DATABASE_URL found, using in-memory storage');
        return;
      }

      console.log('🔍 Attempting MongoDB connection...');
      console.log('🔍 OpenSSL version:', process.versions.openssl);
      console.log('🔍 Node.js version:', process.version);
      const hostPart = uri.split('@')[1]?.split('/')[0] || 'unknown';
      console.log('📍 MongoDB URI host:', hostPart);

      // Extract cluster name and domain from URI for SRV resolution
      const hostname = hostPart.split(',')[0].split(':')[0];
      const hostnameParts = hostname.split('.');
      const domain = hostnameParts.slice(1).join('.');
      let clusterName = hostname.split('.')[0]; // cluster is first part
      let srvHost = '';
      if (uri.startsWith('mongodb+srv://')) {
        srvHost = `_mongodb._tcp.${clusterName}.${domain}`;
      }

      console.log('🔍 Extracted cluster name:', clusterName);
      console.log('🔍 Extracted domain:', domain);
      console.log('🔍 SRV host to resolve:', srvHost);

      // Debug DNS servers
      console.log('🔍 DNS servers:', dns.getServers());

      // Additional DNS validation
      console.log('🔍 Testing DNS resolution with current servers...');
      try {
        const testHosts = ['google.com', 'cloudflare.com', '8.8.8.8'];
        for (const host of testHosts) {
          try {
            const result = await dns.resolve4(host);
            console.log(`✅ DNS resolution for ${host}: ${result.slice(0, 1)}`);
          } catch (err) {
            console.error(`❌ DNS resolution failed for ${host}:`, err.message);
          }
        }
      } catch (err) {
        console.error('❌ DNS validation error:', err);
      }

      // Debug SRV resolution
      try {
        const srvRecords = await dns.resolveSrv(srvHost);
        console.log('🔍 SRV records:', srvRecords);
        // Try to resolve one of the hosts
        if (srvRecords.length > 0) {
          const record = srvRecords[0];
          try {
            const addresses = await dns.resolve4(record.name);
            console.log(`🔍 Resolved ${record.name} to:`, addresses);
          } catch (resolveErr) {
            console.error(`❌ Failed to resolve ${record.name}:`, resolveErr);
          }
        }
      } catch (srvErr) {
        console.error('❌ SRV resolution failed:', srvErr);
      }

      // Test basic DNS resolution to check if DNS is working
      try {
        const testResolve = await dns.resolve4('google.com');
        console.log('🔍 Basic DNS test (google.com):', testResolve.slice(0, 2));
      } catch (dnsTestErr) {
        console.error('❌ Basic DNS test failed:', dnsTestErr);
      }

      // Recommended connection approach for MongoDB Atlas
      this.client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false, // Try without strict mode
          deprecationErrors: true,
        },
        // Add connection timeout for debugging
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
        // Add TLS options to fix SSL issues
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        // Temporarily disable cert validation to test
        rejectUnauthorized: false,
        maxPoolSize: 10,
      });

      console.log('⏳ Connecting to MongoDB...');
      await this.client.connect();
      console.log('🔄 Pinging MongoDB...');
      await this.client.db("admin").command({ ping: 1 });
      this.db = this.client.db("adanma");
      console.log("✅ Connected to MongoDB Atlas");
    } catch (error: any) {
      console.error("❌ MongoDB connection failed:", error?.message || error);
      console.error("❌ Error code:", error?.code);
      console.error("❌ Error name:", error?.name);
      console.error("❌ Full error:", error);
      console.error("❌ Stack trace:", error?.stack);
      console.log("Falling back to in-memory storage");
      if (this.client) {
        try {
          await this.client.close();
        } catch (closeError) {
          console.error("❌ Error closing client:", closeError);
        }
        this.client = null;
      }
    }
  }

  getDb(): Db | null {
    return this.db;
  }

  isConnected(): boolean {
    return this.db !== null;
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();