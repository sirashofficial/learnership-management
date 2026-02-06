import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'appearance-settings.json');

async function ensureSettingsFile() {
  try {
    await fs.access(SETTINGS_DIR);
  } catch {
    await fs.mkdir(SETTINGS_DIR, { recursive: true });
  }

  try {
    await fs.access(SETTINGS_FILE);
  } catch {
    const defaultSettings = {
      theme: 'light',
      colorScheme: 'blue',
      sidebarPosition: 'left',
      compactMode: false,
      fontSize: 'medium',
      showAvatars: true,
      animationsEnabled: true,
    };
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  }
}

// GET - Fetch appearance settings
export async function GET(request: NextRequest) {
  try {
    await ensureSettingsFile();
    
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching appearance settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appearance settings' },
      { status: 500 }
    );
  }
}

// PUT - Update appearance settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    await ensureSettingsFile();
    
    // Read current settings
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const currentSettings = JSON.parse(data);

    // Validate theme
    if (body.theme && !['light', 'dark', 'auto'].includes(body.theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value' },
        { status: 400 }
      );
    }

    // Validate color scheme
    if (body.colorScheme && !['blue', 'purple', 'green', 'orange', 'red'].includes(body.colorScheme)) {
      return NextResponse.json(
        { error: 'Invalid color scheme' },
        { status: 400 }
      );
    }

    // Merge with new settings
    const updatedSettings = {
      ...currentSettings,
      ...body,
    };

    // Save updated settings
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2));

    return NextResponse.json({
      message: 'Appearance settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating appearance settings:', error);
    return NextResponse.json(
      { error: 'Failed to update appearance settings' },
      { status: 500 }
    );
  }
}
