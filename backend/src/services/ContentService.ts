import { databaseService } from './DatabaseService';

interface Content {
  type: string;
  title: string;
  content: string;
  updatedAt: Date;
  updatedBy?: string;
}

export class ContentService {
  private contents: Map<string, Content> = new Map();

  constructor() {
    // Initialize with default content
    this.initializeDefaultContent();
  }

  private initializeDefaultContent() {
    const defaultContents: Content[] = [
      {
        type: 'about',
        title: 'About Adanma',
        content: 'Adanma is your premier African e-commerce platform connecting buyers and vendors across the continent.',
        updatedAt: new Date(),
      },
      {
        type: 'terms',
        title: 'Terms of Service',
        content: 'These terms govern your use of Adanma platform...',
        updatedAt: new Date(),
      },
      {
        type: 'privacy',
        title: 'Privacy Policy',
        content: 'We respect your privacy and are committed to protecting your personal data...',
        updatedAt: new Date(),
      },
      {
        type: 'contact',
        title: 'Contact Us',
        content: 'Get in touch with our support team...',
        updatedAt: new Date(),
      },
    ];

    defaultContents.forEach(content => {
      this.contents.set(content.type, content);
    });
  }

  async getContent(type: string): Promise<Content | null> {
    if (databaseService.isConnected()) {
      try {
        const db = databaseService.getDb()!;
        const collection = db.collection('contents');
        const content = await collection.findOne({ type });
        return content as Content | null;
      } catch (error) {
        console.error('Error fetching content from MongoDB:', error);
        return this.contents.get(type) || null;
      }
    }
    return this.contents.get(type) || null;
  }

  async updateContent(type: string, title: string, content: string, updatedBy?: string): Promise<Content> {
    const updatedContent: Content = {
      type,
      title,
      content,
      updatedAt: new Date(),
      updatedBy,
    };

    if (databaseService.isConnected()) {
      try {
        const db = databaseService.getDb()!;
        const collection = db.collection('contents');
        await collection.replaceOne(
          { type },
          updatedContent,
          { upsert: true }
        );
      } catch (error) {
        console.error('Error saving content to MongoDB:', error);
        // Fall back to in-memory
        this.contents.set(type, updatedContent);
      }
    } else {
      this.contents.set(type, updatedContent);
    }

    return updatedContent;
  }

  async getAllContent(): Promise<{[key: string]: Content}> {
    const result: {[key: string]: Content} = {};

    if (databaseService.isConnected()) {
      try {
        const db = databaseService.getDb()!;
        const collection = db.collection('contents');
        const contents = await collection.find({}).toArray();
        contents.forEach((content: any) => {
          result[content.type] = content;
        });
      } catch (error) {
        console.error('Error fetching all content from MongoDB:', error);
        // Fall back to in-memory
        this.contents.forEach((content, type) => {
          result[type] = content;
        });
      }
    } else {
      this.contents.forEach((content, type) => {
        result[type] = content;
      });
    }

    return result;
  }
}

export const contentService = new ContentService();