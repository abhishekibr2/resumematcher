'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
    companyName: z.string().min(2, {
        message: "Company name must be at least 2 characters.",
    }),
    geminiApiKey: z.string().min(1, {
        message: "Gemini API key is required",
    }),
    redirectToResume: z.boolean(),
    overwritePrompt: z.string(),
});

export default function SettingsPage() {
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            companyName: "",
            geminiApiKey: "",
            redirectToResume: false,
            overwritePrompt: "",
        },
    });

    useEffect(() => {
        // Fetch current settings
        const fetchSettings = async () => {
            const response = await fetch('/api/settings');
            const data = await response.json();
            if (data.success) {
                form.reset(data.settings);
            }
        };
        fetchSettings();
    }, [form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "Settings updated",
                    description: "Your settings have been successfully updated.",
                });
            } else {
                throw new Error(data.message || 'Failed to update settings');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update settings. Please try again.",
                variant: "destructive",
            });
        }
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-8">Settings</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter company name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="geminiApiKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gemini API Key</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Enter Gemini API key" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Your Gemini API key will be encrypted before storing
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="redirectToResume"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Redirect to Resume Page
                                    </FormLabel>
                                    <FormDescription>
                                        Enable automatic redirect to resume page
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="overwritePrompt"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Additional Instructions</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter custom prompt"
                                        className="min-h-[100px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Custom prompt to Pass additional instructions to the AI
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit">Save Settings</Button>
                </form>
            </Form>
        </div>
    );
}