<script setup lang="ts">
definePageMeta({
  layout: false,
});

const { register } = useAuth();

const name = ref("");
const email = ref("");
const password = ref("");
const passwordConfirmation = ref("");
const error = ref<string | null>(null);
const isLoading = ref(false);

async function handleRegister() {
  isLoading.value = true;
  error.value = null;

  if (password.value !== passwordConfirmation.value) {
    error.value = "Passwords do not match";
    isLoading.value = false;
    return;
  }

  try {
    await register(email.value, password.value, passwordConfirmation.value, name.value);
    await navigateTo("/plans");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "An error occurred";
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="bg-background flex min-h-screen w-full items-center justify-center p-6">
    <div class="w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle class="text-2xl">Create Account</CardTitle>

          <CardDescription> Enter your details to create a new account </CardDescription>
        </CardHeader>

        <CardContent>
          <form @submit.prevent="handleRegister">
            <div class="flex flex-col gap-6">
              <div class="grid gap-2">
                <Label for="name">Name</Label>
                <Input id="name" v-model="name" type="text" placeholder="Your name" required />
              </div>

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
                <Input id="password" v-model="password" type="password" required />
              </div>

              <div class="grid gap-2">
                <Label for="password-confirmation">Confirm Password</Label>
                <Input
                  id="password-confirmation"
                  v-model="passwordConfirmation"
                  type="password"
                  required
                />
              </div>

              <div v-if="error" class="text-destructive text-sm" role="alert">{{ error }}</div>

              <Button type="submit" class="w-full" :disabled="isLoading">
                {{ isLoading ? "Creating account..." : "Create Account" }}
              </Button>
            </div>

            <div class="mt-4 text-center text-sm">
              Already have an account?
              <NuxtLink to="/login" class="underline underline-offset-4"> Login </NuxtLink>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
