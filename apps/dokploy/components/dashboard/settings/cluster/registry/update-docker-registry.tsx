import { Button } from "@dokploy/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@dokploy/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@dokploy/components/ui/form";
import { Input } from "@dokploy/components/ui/input";
import { cn } from "@dokploy/lib/utils";
import { api } from "@dokploy/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, PenBoxIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const updateRegistry = z.object({
	registryName: z.string().min(1, {
		message: "Registry name is required",
	}),
	username: z.string().min(1, {
		message: "Username is required",
	}),
	password: z.string(),
	registryUrl: z.string().min(1, {
		message: "Registry URL is required",
	}),
	imagePrefix: z.string(),
});

type UpdateRegistry = z.infer<typeof updateRegistry>;

interface Props {
	registryId: string;
}

export const UpdateDockerRegistry = ({ registryId }: Props) => {
	const utils = api.useUtils();
	const { mutateAsync: testRegistry, isLoading } =
		api.registry.testRegistry.useMutation();
	const { data, refetch } = api.registry.one.useQuery(
		{
			registryId,
		},
		{
			enabled: !!registryId,
		},
	);

	const isCloud = data?.registryType === "cloud";
	const { mutateAsync, isError, error } = api.registry.update.useMutation();

	const form = useForm<UpdateRegistry>({
		defaultValues: {
			imagePrefix: "",
			registryName: "",
			username: "",
			password: "",
			registryUrl: "",
		},
		resolver: zodResolver(updateRegistry),
	});

	const password = form.watch("password");
	const username = form.watch("username");
	const registryUrl = form.watch("registryUrl");
	const registryName = form.watch("registryName");
	const imagePrefix = form.watch("imagePrefix");

	useEffect(() => {
		if (data) {
			form.reset({
				imagePrefix: data.imagePrefix || "",
				registryName: data.registryName || "",
				username: data.username || "",
				password: "",
				registryUrl: data.registryUrl || "",
			});
		}
	}, [form, form.reset, data]);

	const onSubmit = async (data: UpdateRegistry) => {
		await mutateAsync({
			registryId,
			...(data.password ? { password: data.password } : {}),
			registryName: data.registryName,
			username: data.username,
			registryUrl: data.registryUrl,
			imagePrefix: data.imagePrefix,
		})
			.then(async (data) => {
				toast.success("Registry Updated");
				await refetch();
				await utils.registry.all.invalidate();
			})
			.catch(() => {
				toast.error("Error to update the registry");
			});
	};
	return (
		<Dialog>
			<DialogTrigger className="" asChild>
				<Button variant="ghost">
					<PenBoxIcon className="size-4 text-muted-foreground" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-screen  overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Registry</DialogTitle>
					<DialogDescription>Update the registry information</DialogDescription>
				</DialogHeader>
				{isError && (
					<div className="flex flex-row gap-4 rounded-lg bg-red-50 p-2 dark:bg-red-950">
						<AlertTriangle className="text-red-600 dark:text-red-400" />
						<span className="text-sm text-red-600 dark:text-red-400">
							{error?.message}
						</span>
					</div>
				)}

				<Form {...form}>
					<form
						id="hook-form"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-8 "
					>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<FormField
									control={form.control}
									name="registryName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Registry Name</FormLabel>
											<FormControl>
												<Input placeholder="Registry Name" {...field} />
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="username"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Username</FormLabel>
											<FormControl>
												<Input placeholder="Username" {...field} />
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Password</FormLabel>
											<FormControl>
												<Input
													placeholder="Password"
													{...field}
													type="password"
												/>
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>
								{isCloud && (
									<FormField
										control={form.control}
										name="imagePrefix"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Image Prefix</FormLabel>
												<FormControl>
													<Input {...field} placeholder="Image Prefix" />
												</FormControl>

												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								<FormField
									control={form.control}
									name="registryUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Registry URL</FormLabel>
											<FormControl>
												<Input
													placeholder="https://aws_account_id.dkr.ecr.us-west-2.amazonaws.com"
													{...field}
												/>
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
					</form>

					<DialogFooter
						className={cn(
							isCloud ? "sm:justify-between " : "",
							"flex flex-row w-full gap-4 flex-wrap",
						)}
					>
						{isCloud && (
							<Button
								type="button"
								variant={"secondary"}
								isLoading={isLoading}
								onClick={async () => {
									await testRegistry({
										username: username,
										password: password,
										registryUrl: registryUrl,
										registryName: registryName,
										registryType: "cloud",
										imagePrefix: imagePrefix,
									})
										.then((data) => {
											if (data) {
												toast.success("Registry Tested Successfully");
											} else {
												toast.error("Registry Test Failed");
											}
										})
										.catch(() => {
											toast.error("Error to test the registry");
										});
								}}
							>
								Test Registry
							</Button>
						)}

						<Button
							isLoading={form.formState.isSubmitting}
							form="hook-form"
							type="submit"
						>
							Update
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
