import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Using file-based storage for notification preferences
// In production, this should be in a database

const SETTINGS_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'notification-settings.json');

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
      emailNotifications: true,
      pushNotifications: true,
      attendanceAlerts: true,
      assessmentReminders: true,
      weeklyReports: false,
      dailyDigest: false,
      moderationAlerts: true,
      studentProgressUpdates: true,
    };
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  }
}

// GET - Fetch notification settings
export async function GET(request: NextRequest) {
  try {
    await ensureSettingsFile();
    
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// PUT - Update notification settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    await ensureSettingsFile();
    
    // Read current settings
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const currentSettings = JSON.parse(data);

    // Merge with new settings
    const updatedSettings = {
      ...currentSettings,
      ...body,
    };

    // Save updated settings
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2));

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
