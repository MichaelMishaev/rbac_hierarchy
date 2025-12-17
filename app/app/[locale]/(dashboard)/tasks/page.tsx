import { redirect } from 'next/navigation';

export default function TasksPage() {
  // Redirect to inbox by default
  redirect('/tasks/inbox');
}
