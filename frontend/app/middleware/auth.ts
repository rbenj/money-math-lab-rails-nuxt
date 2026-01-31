export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchUser } = useAuth();

  if (user.value === null) {
    await fetchUser();
  }

  if (!user.value) {
    return navigateTo("/login");
  }
});
