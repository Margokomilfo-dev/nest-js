import { validateSync } from 'class-validator';
import { ConfigService } from '@nestjs/config';

export const validationConfigUtility = {
  validatedErrors: (configService: ConfigService) => {
    const errors = validateSync(configService);
    if (errors.length > 0) {
      const shortErrorsArray = errors
        .map((e) => Object.values(e.constraints || {}).join(', '))
        .join('; ');
      throw new Error('Validation failed:' + shortErrorsArray);
    }
  },
  convertToBoolean(value: string) {
    const trimmedValue = value?.trim();
    if (trimmedValue === 'true') return true;
    if (trimmedValue === 'enabled') return true;
    if (trimmedValue === 'false') return false;
    if (trimmedValue === '0') return false;
    if (trimmedValue === 'disabled') return false;

    return null;
  },
  //...others utils
};
