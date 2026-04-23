import { ref } from 'vue'

type SnackbarColor = 'success' | 'error' | 'info' | 'warning'

// Module-level singleton — state is shared across all components
const visible = ref(false)
const message = ref('')
const color = ref<SnackbarColor>('success')

export function useSnackbar() {
  function show(msg: string, snackColor: SnackbarColor = 'success') {
    message.value = msg
    color.value = snackColor
    visible.value = true
  }

  return { visible, message, color, show }
}
