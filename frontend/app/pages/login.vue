<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

definePageMeta({
  layout: false,
});

const { login } = useAuth();

const email = ref('');
const password = ref('');
const error = ref<string | null>(null);
const isLoading = ref(false);

async function handleLogin() {
  isLoading.value = true;
  error.value = null;

  try {
    await login(email.value, password.value);
    await navigateTo('/plans');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'An error occurred';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen w-full items-center justify-center p-6 bg-background">
    <div class="w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle class="text-2xl">Login</CardTitle>

          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form @submit.prevent="handleLogin">
            <div class="flex flex-col gap-6">
              <div class="grid gap-2">
                <Label for="email">Email</Label>
                <Input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>

              <div class="grid gap-2">
                <Label for="password">Password</Label>
                <Input
                  id="password"
                  v-model="password"
                  type="password"
                  required
                />
              </div>

              <div v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</div>

              <Button type="submit" class="w-full" :disabled="isLoading">
                {{ isLoading ? 'Logging in...' : 'Login' }}
              </Button>
            </div>

            <div class="mt-4 text-center text-sm">
              Don't have an account?
              <NuxtLink to="/register" class="underline underline-offset-4">Sign up</NuxtLink>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
