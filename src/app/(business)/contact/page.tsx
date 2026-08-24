"use client";

import { Mail, Phone, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/forms/form-error";
import { contactSchema, type ContactFormData } from "@/lib/schemas/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useSubmitContact } from "@/lib/hooks/useSubmitContact";
import { ApiError } from "@/lib/api/client";

export const dynamic = "force-dynamic";

const CONTACT_EMAIL = "healthdata@nsphcda.ng.gov.ng";
const CONTACT_PHONE = "+234 (0) 803 XXX XXXX";

export default function ContactPage() {
  const mutation = useSubmitContact();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      website: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      await mutation.mutateAsync({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        subject: data.subject,
        message: data.message,
        website: data.website,
      });
      toast.success("Message sent. We'll get back to you if a reply is needed.");
      reset();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Couldn't send your message. Try again in a moment.";
      toast.error(message);
    }
  };

  return (
    <main className="flex-1">
      <div className="border-b bg-muted/40">
        <Container className="py-8">
          <h1 className="text-3xl font-bold">Contact Us</h1>
          <p className="mt-2 text-muted-foreground">
            Get in touch with the NSPHCDA Data Portal team
          </p>
        </Container>
      </div>

      <Container className="py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-4" noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                        Full Name
                      </label>
                      <Input id="name" autoComplete="name" {...register("name")} />
                      <FormError message={errors.name?.message} />
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                        Email Address
                      </label>
                      <Input id="email" type="email" autoComplete="email" {...register("email")} />
                      <FormError message={errors.email?.message} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
                      Phone <span className="font-normal text-muted-foreground">(optional)</span>
                    </label>
                    <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
                    <FormError message={errors.phone?.message} />
                  </div>
                  <div>
                    <label htmlFor="subject" className="mb-1.5 block text-sm font-medium">
                      Subject
                    </label>
                    <Input id="subject" {...register("subject")} />
                    <FormError message={errors.subject?.message} />
                  </div>
                  <div>
                    <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      rows={6}
                      placeholder="Tell us how we can help..."
                      {...register("message")}
                    />
                    <FormError message={errors.message?.message} />
                  </div>
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute -left-[9999px] h-px w-px overflow-hidden"
                    {...register("website")}
                  />
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
                  <div>
                    <p className="font-medium">Email</p>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{CONTACT_PHONE}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      NSPHCDA, Niger State Government Secretariat
                      <br />
                      Minna, Niger State
                      <br />
                      Nigeria
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-2 font-semibold">Office Hours</h3>
                <p className="text-sm text-muted-foreground">
                  Monday - Friday
                  <br />
                  8:00 AM - 4:00 PM (WAT)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
