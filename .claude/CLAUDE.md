# Vision
World-class UI/UX with smooth performance, animations, modern sophisticated aesthetic.
Well defined color system.


## Project Overview

This is a React Native mobile application built with Expo. The app integrates with Supabase for backend services and authentication.

There is also a server/ directory with a tiny flask app that serves as communication between the mobile app and a macOS/windows device. It should only authenticate with the mobile app and not with Supabase.

## IMPORTANT GUIDELINES

Do not write documentation.
Never commit `.env` files.

## Common Development Tasks

### Adding a New Screen
1. Create file in `app/` directory
2. Export default React component
3. Expo Router automatically creates route
4. Update navigation logic in `_layout.js` if auth-related

### Adding a New Component
1. Create file in `components/` directory
2. Use PascalCase naming
3. Export as default or named export
4. Import where needed

### Working with Supabase
```javascript
import { supabase } from '@/config/supabase';

// Query example
const { data, error } = await supabase
  .from('table_name')
  .select('*');

// Auth example
const { user, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```

### Using React Query
```javascript
import { useQuery, useMutation } from '@tanstack/react-query';

// Query
const { data, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: fetchFunction
});

// Mutation
const mutation = useMutation({
  mutationFn: updateFunction,
  onSuccess: () => queryClient.invalidateQueries(['key'])
});
```
