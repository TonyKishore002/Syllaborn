import { describe, it, expect } from 'vitest';
import React from 'react';
import { LandingPage } from '../../src/pages/LandingPage';
import fs from 'fs';
import path from 'path';

describe('Syllaborn Moonsworth-Style Landing Page Integrity', () => {
  it('exports LandingPage component', () => {
    expect(LandingPage).toBeDefined();
    expect(typeof LandingPage).toBe('function');
  });

  it('has all required assets in public folder', () => {
    const mediaDir = path.resolve(process.cwd(), 'public/_next/static/media');
    expect(fs.existsSync(mediaDir)).toBe(true);

    const requiredAssets = [
      'moonsworth.3ncsyhb4fxgww.svg',
      'lunar_client.44ax9ft_31n7j.svg',
      'badlion.1simy6fk_46iq.svg',
      'resourcepacks.31ladp_q02gm0.svg',
      'mcstats.2v3_g1dr__g7c.svg',
      'bedrock_partner.39pjdy37pgs5_.svg',
      'background.1g0xcnp65cqm_.jpg',
      'background.1ukge300x29ux.jpg',
      'background.0kzxmn3myd28s.jpg',
      'background.3eqrinb036dmu.jpg',
      'background.3fct0xenr1mod.jpg',
      'lunar-space.3u5cl68x8az_8.jpg',
      'studio.3wbsa-185wa4x.jpg',
      'PPMori_Semibold-s.p.1b1-e-7e4jije.woff2',
      'PPSupplyMono_Regular-s.p.36zqzq9ursthz.woff2',
    ];

    for (const asset of requiredAssets) {
      const filePath = path.join(mediaDir, asset);
      expect(fs.existsSync(filePath), `Asset ${asset} should exist in public/_next/static/media`).toBe(true);
      expect(fs.statSync(filePath).size).toBeGreaterThan(0);
    }
  });

  it('has required stylesheets in public folder', () => {
    const cssFile = path.resolve(process.cwd(), 'public/_next/static/chunks/38a18hw9ucmyt.css');
    expect(fs.existsSync(cssFile)).toBe(true);
    const cssContent = fs.readFileSync(cssFile, 'utf8');
    expect(cssContent).toContain('--solar-orange');
    expect(cssContent).toContain('PPMori');
    expect(cssContent).toContain('PPSupplyMono');

    const inlineCssFile = path.resolve(process.cwd(), 'public/css/inline_styles.css');
    expect(fs.existsSync(inlineCssFile)).toBe(true);
  });
});
