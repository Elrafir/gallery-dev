import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { ImmichButton } from 'src/emails/components/button.component';
import ImmichLayout from 'src/emails/components/immich.layout';
import { WelcomeEmailProps } from 'src/repositories/email.repository';
import { replaceTemplateTags } from 'src/utils/replace-template-tags';

export const WelcomeEmail = ({ baseUrl, displayName, username, password, customTemplate }: WelcomeEmailProps) => {
  const usableTemplateVariables = {
    displayName,
    username,
    password,
    baseUrl,
  };

  const emailContent = customTemplate ? (
    replaceTemplateTags(customTemplate, usableTemplateVariables)
  ) : (
    <>
      <Text className="m-0">
        Привет, <strong>{displayName}</strong>!
      </Text>

      <Text>Для вас была создана новая учетная запись.</Text>

      <Text>
        <strong>Имя пользователя (Логин)</strong>: {username}
        {password && (
          <>
            <br />
            <strong>Пароль</strong>: {password}
          </>
        )}
      </Text>
    </>
  );

  return (
    <ImmichLayout
      preview={customTemplate ? emailContent.toString() : 'Вас пригласили на новый сервер Immich.'}
    >
      {customTemplate && (
        <Text className="m-0">
          <div dangerouslySetInnerHTML={{ __html: emailContent }}></div>
        </Text>
      )}

      {!customTemplate && emailContent}

      <Section className="flex justify-center my-6">
        <ImmichButton href={`${baseUrl}/auth/login`}>Войти в систему</ImmichButton>
      </Section>

      <Text className="text-xs">
        Если кнопка не работает, используйте ссылку ниже для первого входа.
        <br />
        <Link href={baseUrl}>{baseUrl}</Link>
      </Text>
    </ImmichLayout>
  );
};

WelcomeEmail.PreviewProps = {
  baseUrl: 'https://demo.immich.app/auth/login',
  displayName: 'Alan Turing',
  username: 'alanturing@immich.app',
  password: 'mysuperpassword',
} as WelcomeEmailProps;

export default WelcomeEmail;
