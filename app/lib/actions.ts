"use server";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const formSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.number(),
  status: z.enum(["paid", "pending", "failed"]),
  date: z.string(),
});

const CreateInvoice = formSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: Number(formData.get("amount")),
    status: formData.get("status"),
  });
  const amountInCents = Math.round(Number(amount) * 100);
  const date = new Date().toISOString().split("T")[0];
  try {
    await sql`INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
  } catch (error) {
    console.log(error);
    return { message: "Database Error: Failed to Update Invoice." };
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

const UpdateInvoice = formSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    id: formData.get("id"),
    customerId: formData.get("customerId"),
    amount: Number(formData.get("amount")),
    status: formData.get("status"),
  });
  const amountInCents = Math.round(Number(amount) * 100);
  try {
    await sql`UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}`;
  } catch (error) {
    console.log(error);
    return { message: "Database Error: Failed to Update Invoice." };
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  // throw new Error("There was an error deleting the invoice.");
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath("/dashboard/invoices");
    return { message: "Deleted Invoice." };
  } catch (error) {
    return { message: "Database Error: Failed to Delete Invoice." };
  }
}
