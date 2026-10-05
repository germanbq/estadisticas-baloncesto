"use client";

import styles from "./AccountButton.module.css";
import {
    Show,
    SignInButton,
    UserButton,
} from "@clerk/nextjs";

export default function AccountButton() {
  return (
    <div className={styles.container}>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className={styles.initButtons}>Iniciar sesión</button>
        </SignInButton>
      </Show>

      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  );
}