import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'system-settings.json');

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
      organizationName: 'YEHA - Youth Education',
      timezone: 'Africa/Johannesburg',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      language: 'en',
      currency: 'ZAR',
      attendanceGracePeriod: 15,
      assessmentPassMark: 70,
      autoBackup: true,
      backupFrequency: 'daily',
      maintenanceMode: false,
    };
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  }
}

// GET - Fetch system settings
export async function GET(request: NextRequest) {
  try {
    await ensureSettingsFile();
    
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// PUT - Update system settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    await ensureSettingsFile();
    
    // Read current settings
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const currentSettings = JSON.parse(data);

    // Validate certain fields
    if (body.attendanceGracePeriod !== undefined) {
      const gracePeriod = parseInt(body.attendanceGracePeriod);
      if (isNaN(gracePeriod) || gracePeriod < 0 || gracePeriod > 60) {
        return NextResponse.json(
          { error: 'Attendance grace period must be between 0 and 60 minutes' },
          { status: 400 }
        );
      }
    }

    if (body.assessmentPassMark !== undefined) {
      const passMark = parseInt(body.assessmentPassMark);
      if (isNaN(passMark) || passMark < 0 || passMark > 100) {
        return NextResponse.json(
          { error: 'Assessment pass mark must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    // Merge with new settings
    const updatedSettings = {
      ...currentSettings,
      ...body,
    };

    // Save updated settings
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2));

    return NextResponse.json({
      message: 'System settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}
