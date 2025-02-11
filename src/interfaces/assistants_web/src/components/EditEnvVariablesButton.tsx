'use client';

import React, { useMemo, useState } from 'react';

import { Button, Dropdown, Input } from '@/components/Shared';
import { useContextStore } from '@/context';
import { useListAllDeployments } from '@/hooks/deployments';
import { useParamsStore } from '@/stores';

/**
 * @description Button to trigger a modal to edit .env variables.
 */
export const EditEnvVariablesButton: React.FC<{ className?: string }> = () => {
  const { open, close } = useContextStore();

  const handleClick = () => {
    open({
      title: 'Configure Model Deployment',
      content: <EditEnvVariablesModal onClose={close} defaultDeployment="" />,
    });
  };

  return <Button label="Configure" kind="secondary" onClick={handleClick} />;
};

/**
 * @description Renders a modal to edit a selected deployment's config
 */
export const EditEnvVariablesModal: React.FC<{
  defaultDeployment: string;
  onClose: () => void;
}> = ({ defaultDeployment, onClose }) => {
  const { data: deployments } = useListAllDeployments();

  const [deployment, setDeployment] = useState<string | undefined>(defaultDeployment);
  const [envVariables, setEnvVariables] = useState<Record<string, string>>(() => {
    const selectedDeployment = deployments?.find(({ name }) => name === defaultDeployment);
    return (
      selectedDeployment?.env_vars.reduce<Record<string, string>>((acc, envVar) => {
        acc[envVar] = '';
        return acc;
      }, {}) ?? {}
    );
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setParams } = useParamsStore();

  const deploymentOptions = useMemo(
    () =>
      (deployments ?? []).map(({ name }) => ({
        label: name,
        value: name,
      })),

    [deployments]
  );

  const handleDeploymentChange = (newDeployment: string) => {
    setDeployment(newDeployment);
    const selectedDeployment = deployments?.find(({ name }) => name === newDeployment);
    const emptyEnvVariables =
      selectedDeployment?.env_vars.reduce<Record<string, string>>((acc, envVar) => {
        acc[envVar] = '';
        return acc;
      }, {}) ?? {};
    setEnvVariables(emptyEnvVariables);
  };

  const handleEnvVariableChange = (envVar: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnvVariables({ ...envVariables, [envVar]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!deployment) return;

    setIsSubmitting(true);
    setParams({
      deploymentConfig: Object.entries(envVariables)
        .map(([k, v]) => k + '=' + v)
        .join(';'),
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="flex flex-col gap-y-4 p-4">
      <Dropdown value={deployment} options={deploymentOptions} onChange={handleDeploymentChange} />

      {Object.keys(envVariables).map((envVar) => (
        <Input
          key={envVar}
          placeholder="value"
          label={envVar}
          type="password"
          value={envVariables[envVar]}
          onChange={handleEnvVariableChange(envVar)}
        />
      ))}

      <span className="mt-10 flex items-center justify-between">
        <Button label="Cancel" kind="secondary" onClick={onClose} />
        <Button
          label={isSubmitting ? 'Saving...' : 'Save'}
          onClick={handleSubmit}
          disabled={isSubmitting}
        />
      </span>
    </div>
  );
};
