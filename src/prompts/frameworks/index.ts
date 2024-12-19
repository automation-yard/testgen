import { FrameworkRules } from './types';
import { nestJSRules } from './nestjs';
import { expressRules } from './express';
import { reactRules } from './react';
import { nodejsRules } from './nodejs';

export const frameworkRules: Record<string, FrameworkRules> = {
  nestjs: nestJSRules,
  express: expressRules,
  react: reactRules,
  nodejs: nodejsRules
};

export function getFrameworkRules(framework: string): FrameworkRules {
  const rules = frameworkRules[framework.toLowerCase()];
  if (!rules) {
    throw new Error(`Framework ${framework} not supported`);
  }
  return rules;
}
