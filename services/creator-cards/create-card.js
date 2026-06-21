/* eslint-disable camelcase, no-await-in-loop, no-restricted-syntax */
const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const { ulid } = require('@app-core/randomness');
const creatorCardRepository = require('@app/repository/creator-card');

const spec = `root {
  title string<minLength:3|maxLength:100>
  description? string<maxLength:500>
  slug? string<minLength:5|maxLength:50>
  creator_reference string<minLength:20|maxLength:20>
  links[]? {
    title string<minLength:1|maxLength:100>
    url string<maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<minLength:3|maxLength:100>
      description string<maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<minLength:6|maxLength:6>
}`;

const parsedSpec = validator.parse(spec);

const isAlphanumeric = (str) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < str.length; i++) {
    if (chars.indexOf(str[i]) === -1) return false;
  }
  return true;
};

const generateRandomAlphanumeric = (length) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    result += chars[idx];
  }
  return result;
};

const generateSlugFromTitle = async (title, repository) => {
  const cleanTitle = title.toLowerCase();
  let formatted = '';
  for (let i = 0; i < cleanTitle.length; i++) {
    const char = cleanTitle[i];
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      formatted += '-';
    } else {
      formatted += char;
    }
  }

  const allowed = 'abcdefghijklmnopqrstuvwxyz0123456789-_';
  let slug = '';
  for (let i = 0; i < formatted.length; i++) {
    const char = formatted[i];
    if (allowed.indexOf(char) !== -1) {
      slug += char;
    }
  }

  const isShort = slug.length < 5;
  let isTaken = false;
  if (!isShort) {
    const existing = await repository.findOne({ query: { slug } });
    if (existing) {
      isTaken = true;
    }
  }

  if (isShort || isTaken) {
    let suffix;
    let finalSlug;
    let attempts = 0;
    do {
      suffix = generateRandomAlphanumeric(6);
      finalSlug = `${slug}-${suffix}`;
      const existing = await repository.findOne({ query: { slug: finalSlug } });
      if (!existing) {
        slug = finalSlug;
        break;
      }
      attempts++;
    } while (attempts < 10);
  }

  return slug;
};

async function createCard(serviceData) {
  const data = validator.validate(serviceData, parsedSpec);

  // 1. Links URL validation
  if (data.links) {
    for (const link of data.links) {
      if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
        throwAppError('URL must start with http:// or https://', 'VALIDATIONERR');
      }
    }
  }

  // 2. Service rates amount validation (must be positive integer, no decimals)
  if (data.service_rates && data.service_rates.rates) {
    for (const rate of data.service_rates.rates) {
      if (!Number.isInteger(rate.amount) || rate.amount <= 0) {
        throwAppError('Amount must be a positive integer', 'VALIDATIONERR');
      }
    }
  }

  // 3. Conditional access_code logic
  const accessType = data.access_type || 'public';
  if (accessType === 'private') {
    if (!data.access_code) {
      throwAppError('access_code is required when access_type is private', 'AC01');
    }
    if (!isAlphanumeric(data.access_code)) {
      throwAppError('access_code must be alphanumeric', 'VALIDATIONERR');
    }
  } else if (data.access_code) {
    throwAppError('access_code can only be set on private cards', 'AC05');
  }

  // 4. Slug validation or generation
  let slug;
  if (data.slug) {
    // Validate slug characters
    const allowed = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
    for (let i = 0; i < data.slug.length; i++) {
      if (allowed.indexOf(data.slug[i]) === -1) {
        throwAppError('Slug contains invalid characters', 'VALIDATIONERR');
      }
    }
    // Check uniqueness
    const existing = await creatorCardRepository.findOne({ query: { slug: data.slug } });
    if (existing) {
      throwAppError('Slug is already taken', 'SL02');
    }
    slug = data.slug;
  } else {
    slug = await generateSlugFromTitle(data.title, creatorCardRepository);
  }

  const now = Date.now();
  const cardData = {
    _id: ulid(),
    title: data.title,
    description: data.description,
    slug,
    creator_reference: data.creator_reference,
    links: data.links || [],
    service_rates: data.service_rates,
    status: data.status,
    access_type: accessType,
    access_code: data.access_code || null,
    created: now,
    updated: now,
    deleted: 0,
  };

  const createdCard = await creatorCardRepository.create(cardData);

  return {
    id: createdCard._id,
    title: createdCard.title,
    description: createdCard.description || null,
    slug: createdCard.slug,
    creator_reference: createdCard.creator_reference,
    links: createdCard.links || [],
    service_rates: createdCard.service_rates || null,
    status: createdCard.status,
    access_type: createdCard.access_type,
    access_code: createdCard.access_code,
    created: createdCard.created,
    updated: createdCard.updated,
    deleted: null,
  };
}

module.exports = createCard;
